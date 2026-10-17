import useSWR from 'swr';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to fetch and manage the user's detailed profile (patient or donor).
 */
export function useProfile() {
  const { user, role } = useAuth();

  const { data: profile, error, mutate, isLoading } = useSWR(
    user ? `profile-${user.id}` : null,
    async () => {
      if (!user) return null;

      // Fetch base profile
      const { data: baseProfile, error: baseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (baseError) throw baseError;

      // Fetch role-specific details
      const detailTable = role === 'patient' ? 'patient_profiles' : 'donor_profiles';
      const { data: detailProfile, error: detailError } = await supabase
        .from(detailTable)
        .select('*')
        .eq('id', user.id)
        .single();

      if (detailError && detailError.code !== 'PGRST116') {
        // PGRST116 is code for no row found, which is fine during sign up
        throw detailError;
      }

      return {
        ...baseProfile,
        details: detailProfile || {},
      };
    }
  );

  return {
    profile,
    error,
    loading: isLoading,
    mutate,
  };
}

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const profileSchema = zod.object({
  fullName: zod.string().min(2, 'Name must be at least 2 characters'),
  phone: zod.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: zod.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date of birth',
  }),
  bloodGroup: zod.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Please select a blood group' }),
  }),
  city: zod.string().min(2, 'City is required'),
  state: zod.string().min(2, 'State is required'),
  gender: zod.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  weightKg: zod.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num >= 45 && num <= 150;
  }, { message: 'Weight must be between 45 and 150 kg for blood donation eligibility' }),
  medicalConditions: zod.string().optional()
});

export default function DonorProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileSchema)
  });

  const loadProfile = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      // Fetch from Supabase
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profError) throw profError;

      const { data: donorProfile, error: donorError } = await supabase
        .from('donor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (donorError && donorError.code !== 'PGRST116') throw donorError;

      reset({
        fullName: profile.full_name || '',
        phone: profile.phone || '',
        dateOfBirth: profile.date_of_birth || '',
        bloodGroup: profile.blood_group || 'O+',
        city: profile.city || '',
        state: profile.state || '',
        gender: donorProfile?.gender || 'Male',
        weightKg: donorProfile?.weight_kg ? String(donorProfile.weight_kg) : '',
        medicalConditions: donorProfile?.medical_conditions || ''
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      toast.error('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  }, [user, reset]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProfile();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadProfile]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const profileUpdates = {
        full_name: data.fullName,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        blood_group: data.bloodGroup,
        city: data.city,
        state: data.state,
      };

      const donorUpdates = {
        gender: data.gender,
        weight_kg: parseFloat(data.weightKg),
        medical_conditions: data.medicalConditions || null
      };

      // Update profiles table
      const { error: profErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profErr) throw profErr;

      // Upsert donor_profiles table
      const { error: donorErr } = await supabase
        .from('donor_profiles')
        .upsert({
          id: user.id,
          ...donorUpdates
        });

      if (donorErr) throw donorErr;

      toast.success('Profile updated successfully!');
      loadProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
      toast.error('Failed to save profile details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader 
        title="My Profile" 
        subtitle="Manage your personal information, contact info, and medical details." 
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Enter full name"
                {...register('fullName')}
                error={errors.fullName?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  placeholder="E.g. 9876543210"
                  {...register('phone')}
                  error={errors.phone?.message}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  {...register('dateOfBirth')}
                  error={errors.dateOfBirth?.message}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  {...register('bloodGroup')}
                  error={errors.bloodGroup?.message}
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </Select>
                <Select
                  label="Gender"
                  {...register('gender')}
                  error={errors.gender?.message}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clinical & Regional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Clinical & Regional Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  placeholder="Enter city"
                  {...register('city')}
                  error={errors.city?.message}
                />
                <Input
                  label="State"
                  placeholder="Enter state"
                  {...register('state')}
                  error={errors.state?.message}
                />
              </div>

              <Input
                label="Weight (kg)"
                placeholder="Enter weight in kg"
                type="number"
                step="0.1"
                {...register('weightKg')}
                error={errors.weightKg?.message}
              />

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Medical Conditions (Optional)
                </label>
                <textarea
                  rows="3"
                  className="w-full bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none resize-none"
                  placeholder="Specify any relevant medical conditions or history"
                  {...register('medicalConditions')}
                />
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving ? 'Saving changes...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
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
  thalassemiaType: zod.enum(['Major', 'Intermedia', 'Minor', 'Not Diagnosed'], {
    errorMap: () => ({ message: 'Please select thalassemia type' }),
  }),
  city: zod.string().min(2, 'City is required'),
  state: zod.string().min(2, 'State is required'),
  emergencyContactName: zod.string().min(2, 'Emergency contact name is required'),
  emergencyContactPhone: zod.string().min(10, 'Emergency contact phone is required'),
  treatingDoctor: zod.string().optional(),
  treatingHospital: zod.string().optional(),
  diagnosisYear: zod.string().optional()
    .refine((val) => !val || (!isNaN(parseInt(val)) && parseInt(val) > 1950 && parseInt(val) <= new Date().getFullYear()), {
      message: 'Please enter a valid diagnosis year',
    }),
  currentMedications: zod.string().optional(),
  knownAllergies: zod.string().optional(),
});

export default function PatientProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (!user) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        // Fetch from Supabase
        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profError) throw profError;

        const { data: patientProfile, error: patError } = await supabase
          .from('patient_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (patError && patError.code !== 'PGRST116') throw patError; // Ignore if record does not exist yet

        reset({
          fullName: profile.full_name || '',
          phone: profile.phone || '',
          dateOfBirth: profile.date_of_birth || '',
          bloodGroup: profile.blood_group || 'AB+',
          thalassemiaType: patientProfile?.thalassemia_type || 'Major',
          city: profile.city || '',
          state: profile.state || '',
          emergencyContactName: patientProfile?.emergency_contact_name || '',
          emergencyContactPhone: patientProfile?.emergency_contact_phone || '',
          treatingDoctor: patientProfile?.treating_doctor || '',
          treatingHospital: patientProfile?.treating_hospital || '',
          diagnosisYear: patientProfile?.diagnosis_year ? String(patientProfile.diagnosis_year) : '',
          currentMedications: patientProfile?.current_medications || '',
          knownAllergies: patientProfile?.known_allergies || '',
        });
      } catch (err) {
        console.error('Error loading profile:', err);
        toast.error('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, reset]);

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

      const patientUpdates = {
        thalassemia_type: data.thalassemiaType,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        treating_doctor: data.treatingDoctor || null,
        treating_hospital: data.treatingHospital || null,
        diagnosis_year: data.diagnosisYear ? parseInt(data.diagnosisYear) : null,
        current_medications: data.currentMedications || null,
        known_allergies: data.knownAllergies || null,
      };

      // DB Updates
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Check if patient profile exists, upsert accordingly
      const { error: patientError } = await supabase
        .from('patient_profiles')
        .upsert({
          id: user.id,
          ...patientUpdates
        });

      if (patientError) throw patientError;

      // Also update Auth metadata so header updates instantly
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.fullName,
          phone: data.phone,
          date_of_birth: data.dateOfBirth,
          blood_group: data.bloodGroup,
          role: 'patient',
          ...patientUpdates
        }
      });

      if (authError) throw authError;

      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Profile Settings" 
        subtitle="Manage your contact details, clinical parameters, and emergency medical contacts." 
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              id="fullName"
              placeholder="John Doe"
              error={errors.fullName}
              {...register('fullName')}
            />
            <Input
              label="Email Address"
              id="email"
              type="email"
              value={user?.email || ''}
              disabled={true}
              className="opacity-60 cursor-not-allowed"
            />
            <Input
              label="Phone Number"
              id="phone"
              placeholder="9876543210"
              error={errors.phone}
              {...register('phone')}
            />
            <Input
              label="Date of Birth"
              id="dateOfBirth"
              type="date"
              error={errors.dateOfBirth}
              {...register('dateOfBirth')}
            />
          </CardContent>
        </Card>

        {/* Location & Medical Core */}
        <Card>
          <CardHeader>
            <CardTitle>Clinical & Location Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Blood Group"
              id="bloodGroup"
              options={[
                { value: 'A+', label: 'A+' },
                { value: 'A-', label: 'A-' },
                { value: 'B+', label: 'B+' },
                { value: 'B-', label: 'B-' },
                { value: 'AB+', label: 'AB+' },
                { value: 'AB-', label: 'AB-' },
                { value: 'O+', label: 'O+' },
                { value: 'O-', label: 'O-' }
              ]}
              error={errors.bloodGroup}
              {...register('bloodGroup')}
            />
            <Select
              label="Thalassemia Type"
              id="thalassemiaType"
              options={[
                { value: 'Major', label: 'Thalassemia Major' },
                { value: 'Intermedia', label: 'Thalassemia Intermedia' },
                { value: 'Minor', label: 'Thalassemia Minor / Trait' },
                { value: 'Not Diagnosed', label: 'Not Diagnosed / Under Evaluation' }
              ]}
              error={errors.thalassemiaType}
              {...register('thalassemiaType')}
            />
            <Input
              label="City"
              id="city"
              placeholder="Mumbai"
              error={errors.city}
              {...register('city')}
            />
            <Input
              label="State"
              id="state"
              placeholder="Maharashtra"
              error={errors.state}
              {...register('state')}
            />
          </CardContent>
        </Card>

        {/* Emergency Contact & Treating Doctors */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency & Care Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Emergency Contact Name"
              id="emergencyContactName"
              placeholder="Jane Doe"
              error={errors.emergencyContactName}
              {...register('emergencyContactName')}
            />
            <Input
              label="Emergency Contact Phone"
              id="emergencyContactPhone"
              placeholder="9876543211"
              error={errors.emergencyContactPhone}
              {...register('emergencyContactPhone')}
            />
            <Input
              label="Treating Doctor"
              id="treatingDoctor"
              placeholder="Dr. Deshmukh"
              error={errors.treatingDoctor}
              {...register('treatingDoctor')}
            />
            <Input
              label="Hospital / Clinic Name"
              id="treatingHospital"
              placeholder="KEM Hospital"
              error={errors.treatingHospital}
              {...register('treatingHospital')}
            />
            <Input
              label="Year of Diagnosis"
              id="diagnosisYear"
              placeholder="e.g. 2015"
              error={errors.diagnosisYear}
              {...register('diagnosisYear')}
            />
          </CardContent>
        </Card>

        {/* Medications & Allergies */}
        <Card>
          <CardHeader>
            <CardTitle>Medications & Allergies</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="currentMedications" className="block text-xs font-semibold text-text-secondary uppercase mb-2">Current Medications</label>
              <textarea
                id="currentMedications"
                rows={3}
                placeholder="e.g. Hydroxurea, Kelfer 500mg"
                className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] p-3 text-xs focus:outline-none focus:border-[#3ecf8e]"
                {...register('currentMedications')}
              />
            </div>
            <div>
              <label htmlFor="knownAllergies" className="block text-xs font-semibold text-text-secondary uppercase mb-2">Known Allergies</label>
              <textarea
                id="knownAllergies"
                rows={3}
                placeholder="e.g. Penicillin, Sulfur based drugs, None"
                className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] p-3 text-xs focus:outline-none focus:border-[#3ecf8e]"
                {...register('knownAllergies')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex justify-end gap-4 border-t border-border-subtle pt-4">
          <Button variant="outline" type="button" onClick={() => window.history.back()}>
            Back
          </Button>
          <Button variant="patient" type="submit" isLoading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}

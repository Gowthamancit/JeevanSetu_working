import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Heart } from 'lucide-react';

const registerSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: zod.string(),
  fullName: zod.string().min(2, 'Name must be at least 2 characters'),
  phone: zod.string().min(10, 'Phone number must be at least 10 digits'),
  dateOfBirth: zod.string().refine((val) => {
    const dob = new Date(val);
    const age = new Date().getFullYear() - dob.getFullYear();
    return age >= 18 && age <= 65;
  }, {
    message: 'Donors must be between 18 and 65 years old',
  }),
  bloodGroup: zod.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], {
    errorMap: () => ({ message: 'Please select a blood group' }),
  }),
  gender: zod.enum(['Male', 'Female', 'Other'], {
    errorMap: () => ({ message: 'Please select your gender' }),
  }),
  weightKg: zod.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 45, {
    message: 'Weight must be at least 45 kg to donate blood',
  }),
  city: zod.string().min(2, 'City is required'),
  state: zod.string().min(2, 'State is required'),
  willingToTravel: zod.boolean().default(true),
  maxTravelDistanceKm: zod.string().refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
    message: 'Please enter a valid range',
  }),
  lastDonationDate: zod.string().optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Please enter a valid donation date',
    }),
  medicalConditions: zod.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function DonorRegister() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      willingToTravel: true,
      maxTravelDistanceKm: '10'
    }
  });

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword', 'fullName', 'phone', 'dateOfBirth'];
    } else if (step === 2) {
      fieldsToValidate = ['bloodGroup', 'gender', 'weightKg', 'lastDonationDate', 'medicalConditions'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const result = await signUp(data.email, data.password, {
        role: 'donor',
        full_name: data.fullName,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        blood_group: data.bloodGroup,
        gender: data.gender,
        weight_kg: parseFloat(data.weightKg),
        city: data.city,
        state: data.state,
        willing_to_travel: data.willingToTravel,
        max_travel_distance_km: parseInt(data.maxTravelDistanceKm),
        last_donation_date: data.lastDonationDate || null,
        medical_conditions: data.medicalConditions || null,
      });

      if (result?.user?.id?.startsWith('demo-')) {
        toast.success('Supabase Rate Limited. Entered Offline Demo Mode successfully!');
        navigate('/donor/dashboard');
      } else {
        toast.success('Registration successful! Please check your email or log in.');
        navigate('/donor/login');
      }
    } catch (err) {
      console.error('Registration error:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full p-2 shadow-2xl">
        <CardHeader className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center font-bold text-bg-primary">
              <Heart size={16} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Jeevan<span className="text-brand-primary">Setu</span>
            </span>
          </Link>
          <CardTitle>Donor Registration</CardTitle>
          <CardDescription>
            Register as a voluntary blood donor, share your availability, and save thalassemia patients.
          </CardDescription>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${step >= 1 ? 'bg-brand-primary text-bg-primary' : 'bg-bg-elevated text-text-muted'}`}>1. Personal</span>
            <div className="h-[1px] w-8 bg-border-subtle" />
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${step >= 2 ? 'bg-brand-primary text-bg-primary' : 'bg-bg-elevated text-text-muted'}`}>2. Health</span>
            <div className="h-[1px] w-8 bg-border-subtle" />
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${step >= 3 ? 'bg-brand-primary text-bg-primary' : 'bg-bg-elevated text-text-muted'}`}>3. Travel</span>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Step 1: Personal Info */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  id="fullName"
                  placeholder="John Doe"
                  error={errors.fullName}
                  {...register('fullName')}
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
                <Input
                  label="Email Address"
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  error={errors.email}
                  {...register('email')}
                />
                <Input
                  label="Password"
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password}
                  {...register('password')}
                />
                <Input
                  label="Confirm Password"
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword}
                  {...register('confirmPassword')}
                />
              </div>
            )}

            {/* Step 2: Medical & Eligibility */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Blood Group"
                  id="bloodGroup"
                  placeholder="Select Blood Group"
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
                  label="Gender"
                  id="gender"
                  placeholder="Select Gender"
                  options={[
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' }
                  ]}
                  error={errors.gender}
                  {...register('gender')}
                />
                <Input
                  label="Weight (kg)"
                  id="weightKg"
                  placeholder="e.g. 65"
                  error={errors.weightKg}
                  {...register('weightKg')}
                />
                <Input
                  label="Last Donation Date (Optional)"
                  id="lastDonationDate"
                  type="date"
                  error={errors.lastDonationDate}
                  {...register('lastDonationDate')}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Medical Conditions / Medications (Optional)"
                    id="medicalConditions"
                    placeholder="e.g. None, High BP (controlled)"
                    error={errors.medicalConditions}
                    {...register('medicalConditions')}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Location & Travel Settings */}
            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="md:col-span-2 flex flex-col gap-2 p-3 bg-bg-secondary/40 border border-border-subtle rounded-lg mt-2">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="willingToTravel"
                      className="w-4 h-4 text-brand-primary bg-bg-input border-border-main rounded focus:ring-brand-primary"
                      {...register('willingToTravel')}
                    />
                    <span className="text-xs font-semibold text-text-primary">I am willing to travel to nearby cities for urgent requests</span>
                  </label>
                  <p className="text-[10px] text-text-muted pl-7">
                    Enabling this makes you discoverable by patients needing urgent transfusions outside your city limit.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Max Travel Distance (km)"
                    id="maxTravelDistanceKm"
                    type="number"
                    placeholder="e.g. 15"
                    error={errors.maxTravelDistanceKm}
                    {...register('maxTravelDistanceKm')}
                  />
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-border-subtle">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep}>
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <Button type="button" variant="primary" onClick={nextStep}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" variant="primary" isLoading={submitting}>
                  Register Donor
                </Button>
              )}
            </div>
          </form>

          {/* Footer Redirect */}
          <div className="text-center text-xs pt-4 border-t border-border-subtle mt-4 text-text-muted">
            Already have a donor account?{' '}
            <Link to="/donor/login" className="text-brand-primary hover:underline font-semibold">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function PatientRegister() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, formState: { errors }, trigger } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const nextStep = async () => {
    // Validate current step fields before proceeding
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['email', 'password', 'confirmPassword', 'fullName', 'phone', 'dateOfBirth'];
    } else if (step === 2) {
      fieldsToValidate = ['bloodGroup', 'thalassemiaType', 'city', 'state'];
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
        role: 'patient',
        full_name: data.fullName,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        blood_group: data.bloodGroup,
        city: data.city,
        state: data.state,
        thalassemia_type: data.thalassemiaType,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        treating_doctor: data.treatingDoctor || null,
        treating_hospital: data.treatingHospital || null,
        diagnosis_year: data.diagnosisYear ? parseInt(data.diagnosisYear) : null,
      });

      if (result?.user?.id?.startsWith('demo-')) {
        toast.success('Supabase Rate Limited. Entered Offline Demo Mode successfully!');
        navigate('/patient/dashboard');
      } else {
        toast.success('Registration successful! Please check your email or log in.');
        navigate('/patient/login');
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
            <div className="w-8 h-8 rounded bg-purple-accent flex items-center justify-center font-bold text-bg-primary">
              <Heart size={16} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight font-sans">
              Jeevan<span className="text-purple-accent">Setu</span>
            </span>
          </Link>
          <CardTitle>Patient Registration</CardTitle>
          <CardDescription>
            Create an account to track your hemoglobin trends, log transfusions, and request blood.
          </CardDescription>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${step >= 1 ? 'bg-purple-accent text-bg-primary' : 'bg-bg-elevated text-text-muted'}`}>1. Personal</span>
            <div className="h-[1px] w-8 bg-border-subtle" />
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${step >= 2 ? 'bg-purple-accent text-bg-primary' : 'bg-bg-elevated text-text-muted'}`}>2. Medical</span>
            <div className="h-[1px] w-8 bg-border-subtle" />
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${step >= 3 ? 'bg-purple-accent text-bg-primary' : 'bg-bg-elevated text-text-muted'}`}>3. Clinical</span>
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

            {/* Step 2: Location & Thalassemia Info */}
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
                  label="Thalassemia Diagnosis"
                  id="thalassemiaType"
                  placeholder="Select Type"
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
              </div>
            )}

            {/* Step 3: Emergency & Clinical Contact */}
            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  label="Treating Doctor (Optional)"
                  id="treatingDoctor"
                  placeholder="Dr. Smith"
                  error={errors.treatingDoctor}
                  {...register('treatingDoctor')}
                />
                <Input
                  label="Hospital / Clinic Name (Optional)"
                  id="treatingHospital"
                  placeholder="City General Hospital"
                  error={errors.treatingHospital}
                  {...register('treatingHospital')}
                />
                <Input
                  label="Year of Diagnosis (Optional)"
                  id="diagnosisYear"
                  placeholder="e.g. 2018"
                  error={errors.diagnosisYear}
                  {...register('diagnosisYear')}
                />
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
                <Button type="button" variant="patient" onClick={nextStep}>
                  Next Step
                </Button>
              ) : (
                <Button type="submit" variant="patient" isLoading={submitting}>
                  Register Patient
                </Button>
              )}
            </div>
          </form>

          {/* Footer Redirect */}
          <div className="text-center text-xs pt-4 border-t border-border-subtle mt-4 text-text-muted">
            Already have a patient account?{' '}
            <Link to="/patient/login" className="text-purple-accent hover:underline font-semibold">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Heart } from 'lucide-react';

const loginSchema = zod.object({
  email: zod.string().email('Please enter a valid email address'),
  password: zod.string().min(6, 'Password must be at least 6 characters'),
});

export default function DonorLogin() {
  const { signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      // Sign in user
      const result = await signIn(data.email, data.password);
      
      // Query profiles to confirm correct role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', result.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Could not retrieve user profile details.');
      }
      const userRole = profile.role;

      if (userRole !== 'donor') {
        // Sign out if role mismatch
        await signOut();
        toast.error('This account is registered as a Patient. Please log in through the Patient Portal.', {
          duration: 5000,
        });
        return;
      }

      toast.success('Successfully logged in!');
      navigate('/donor/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      toast.error(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex items-center justify-center p-6">
      <div className="bg-bg-card border border-border-subtle rounded-xl max-w-md w-full p-8 shadow-2xl space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col items-center text-center space-y-2">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-brand-primary flex items-center justify-center font-bold text-bg-primary">
              <Heart size={16} fill="currentColor" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Jeevan<span className="text-brand-primary">Setu</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold">Donor Portal Login</h2>
          <p className="text-xs text-text-muted">
            Access your donor dashboard, update availability, or check active blood requests.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <Button
            type="submit"
            variant="primary"
            isLoading={submitting}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        {/* Footer info */}
        <div className="text-center text-xs space-y-2 pt-2 border-t border-border-subtle">
          <p className="text-text-muted">
            Don't have a donor account?{' '}
            <Link to="/donor/register" className="text-brand-primary hover:underline font-semibold">
              Register Here
            </Link>
          </p>
          <p className="text-text-muted text-[10px]">
            Are you a thalassemia patient?{' '}
            <Link to="/patient/login" className="text-purple-accent hover:underline font-semibold">
              Login to Patient Portal
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

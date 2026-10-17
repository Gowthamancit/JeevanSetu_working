import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/ui/StatCard';
import BloodGroupBadge from '../../components/ui/BloodGroupBadge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  Heart, 
  Activity, 
  Award, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';

const canDonateTo = {
  'O-':  ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  'O+':  ['A+','B+','AB+','O+'],
  'A-':  ['A+','A-','AB+','AB-'],
  'A+':  ['A+','AB+'],
  'B-':  ['B+','B-','AB+','AB-'],
  'B+':  ['B+','AB+'],
  'AB-': ['AB+','AB-'],
  'AB+': ['AB+']
};

export default function DonorOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [donorProfile, setDonorProfile] = useState(null);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState([]);
  
  const fetchOverviewData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      // Query database
      const { data: profile, error: profError } = await supabase
        .from('profiles')
        .select('*, donor_profiles(*)')
        .eq('id', user.id)
        .single();
        
      if (profError) throw profError;

      setProfileData(profile);
      setDonorProfile(profile.donor_profiles);

      // Fetch compatible pending requests
      const compatibleGroups = canDonateTo[profile.blood_group] || [];
      const { data: requests, error: reqError } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('status', 'Open')
        .in('blood_group_needed', compatibleGroups)
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      setPendingRequestsCount(requests?.length || 0);
      setRecentRequests(requests?.slice(0, 3) || []);
    } catch (err) {
      console.error('Error fetching donor dashboard:', err);
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverviewData();
    }, 0);

    // Subscribe to notification table to alert donor of new matches
    const channel = supabase
      .channel('donor_matches_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donor_notifications', filter: `donor_id=eq.${user.id}` }, () => {
        fetchOverviewData();
      })
      .subscribe();
      
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user, fetchOverviewData]);

  // Compute donor status & eligibility
  const getEligibilityStatus = () => {
    if (!donorProfile) return { eligible: false, text: 'Unknown', color: 'bg-text-muted text-text-primary' };
    
    const today = new Date().toISOString().split('T')[0];
    if (donorProfile.is_deferred && donorProfile.deferral_until && donorProfile.deferral_until > today) {
      return { 
        eligible: false, 
        text: `Deferred until ${formatDateStr(donorProfile.deferral_until)}`, 
        color: 'bg-error/20 text-error border border-error/30' 
      };
    }
    
    if (donorProfile.next_eligible_date && donorProfile.next_eligible_date > today) {
      return { 
        eligible: false, 
        text: `Eligible from ${formatDateStr(donorProfile.next_eligible_date)}`, 
        color: 'bg-warning/20 text-warning border border-warning/30' 
      };
    }
    
    if (!donorProfile.is_available) {
      return { 
        eligible: false, 
        text: 'Unavailable (Offline)', 
        color: 'bg-text-muted/20 text-text-secondary border border-border-subtle' 
      };
    }
    
    return { 
      eligible: true, 
      text: 'Eligible to Donate', 
      color: 'bg-success/20 text-success border border-success/30' 
    };
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Compute progress for 90 days transfusion/donation block
  const getDonationStreak = () => {
    if (!donorProfile || !donorProfile.last_donation_date) return { daysSince: 'N/A', progress: 100 };
    const lastDate = new Date(donorProfile.last_donation_date);
    const diffTime = Math.abs(new Date() - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const progress = Math.min(100, Math.floor((diffDays / 90) * 100));
    return {
      daysSince: `${diffDays} days`,
      progress
    };
  };

  const eligibility = getEligibilityStatus();
  const streak = getDonationStreak();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Ambient background glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] rounded-full bg-brand-primary/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-purple-accent/5 blur-[100px] pointer-events-none z-0" />

      {/* Top Banner Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border-subtle pb-6 bg-gradient-to-r from-bg-secondary/40 to-transparent p-6 rounded-2xl border border-border-subtle backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-brand-primary bg-clip-text text-transparent flex items-center gap-2">
            Welcome back, {profileData?.full_name || 'Donor'} ❤️
          </h1>
          <p className="text-xs text-text-secondary mt-2 max-w-xl leading-relaxed">
            Thank you for being part of JeevanSetu's lifesaving donor network. Your contribution is critical for Thalassemia patients.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BloodGroupBadge bloodGroup={profileData?.blood_group} />
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-lg border ${eligibility.color}`}>
            {eligibility.text}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Total Donations" 
            value={donorProfile?.total_donations || 0} 
            icon={<Heart size={20} className="text-success animate-pulse" />} 
            className="border-success/10 group-hover:border-success/30 transition-colors shadow-lg shadow-success/2"
          />
        </div>
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Pending Requests" 
            value={pendingRequestsCount} 
            icon={<Activity size={20} className="text-warning" />} 
            trend={pendingRequestsCount > 0 ? "Compatible matches open" : "Perfect match state"}
            className="border-warning/10 group-hover:border-warning/30 transition-colors shadow-lg shadow-warning/2"
          />
        </div>
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Lives Impacted" 
            value={(donorProfile?.total_donations || 0) * 3} 
            icon={<Award size={20} className="text-purple-accent" />} 
            trend="Calculated 1 donation = 3 lives"
            className="border-purple-accent/10 group-hover:border-purple-accent/30 transition-colors shadow-lg shadow-purple-accent/2"
          />
        </div>
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Next Eligible Date" 
            value={donorProfile?.next_eligible_date ? formatDateStr(donorProfile.next_eligible_date) : 'Eligible Now'} 
            icon={<Calendar size={20} className="text-info" />} 
            trend="Based on 90-day cycle"
            className="border-info/10 group-hover:border-info/30 transition-colors shadow-lg shadow-info/2"
          />
        </div>
      </div>

      {/* Pending Alert Banner */}
      {pendingRequestsCount > 0 && (
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5 bg-gradient-to-r from-warning-muted/10 to-transparent border border-warning/30 p-5 rounded-2xl bg-bg-card shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning/10 rounded-xl text-warning shrink-0 border border-warning/20">
              <AlertTriangle className="animate-bounce shrink-0" size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary">
                Urgent Blood Requests Matching Your Compatibility!
              </h4>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                There are {pendingRequestsCount} open compatible requests matching your blood group. Every transfusion counts.
              </p>
            </div>
          </div>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => navigate('/donor/dashboard/requests')}
            className="shadow-lg shadow-brand-primary/10 hover:shadow-brand-primary/20 shrink-0"
          >
            View Requests
          </Button>
        </div>
      )}

      {/* Main split grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Donation cycle / Streak Card */}
        <div className="bg-gradient-to-br from-bg-card to-bg-secondary border border-border-main rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-3">
              <Clock size={16} className="text-info" />
              Donation Eligibility Cycle
            </h3>
            <p className="text-xs text-text-secondary mt-3 leading-relaxed">
              Minimum gap between donations is 90 days to ensure donor safety & red cell replenishment.
            </p>
            
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1.5">
                  <span className="text-text-secondary">Days Since Last Donation</span>
                  <span className="text-text-primary font-mono">{streak.daysSince}</span>
                </div>
                <div className="w-full bg-bg-elevated h-2.5 rounded-full overflow-hidden border border-border-subtle">
                  <div 
                    className="bg-brand-primary h-full rounded-full transition-all duration-500 shadow-md shadow-brand-primary/20"
                    style={{ width: `${streak.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border-subtle pt-4 mt-6">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-secondary">Last donation logged:</span>
              <span className="text-text-primary font-bold font-mono">
                {donorProfile?.last_donation_date ? formatDateStr(donorProfile.last_donation_date) : 'None logged'}
              </span>
            </div>
          </div>
        </div>

        {/* Compatible requests sidebar */}
        <div className="lg:col-span-2 bg-gradient-to-br from-bg-card to-bg-secondary border border-border-main rounded-2xl p-6 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2 border-b border-border-subtle pb-3">
            <TrendingUp size={16} className="text-brand-primary" />
            Compatible Quick Matches
          </h3>
          
          <div className="space-y-4 pt-1">
            {recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-text-muted">
                <CheckCircle size={36} className="mb-3 text-success/40" />
                <p className="text-xs font-bold text-text-secondary">No compatible open requests found</p>
                <p className="text-[10px] text-text-muted mt-1 max-w-xs">Excellent! There are no matching patient requests currently pending in your region.</p>
              </div>
            ) : (
              recentRequests.map((req) => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between p-4 bg-bg-secondary/60 rounded-xl border border-border-subtle hover:border-border-main transition-all duration-200 group"
                >
                  <div className="flex items-center gap-4">
                    <BloodGroupBadge bloodGroup={req.blood_group_needed} />
                    <div>
                      <h4 className="text-sm font-bold text-text-primary group-hover:text-brand-primary transition-colors">
                        {req.hospital_name}
                      </h4>
                      <p className="text-xs text-text-secondary flex items-center gap-1.5 mt-1">
                        <MapPin size={12} className="text-text-muted" />
                        {req.hospital_city} • Needs <span className="font-semibold text-text-primary font-mono">{req.units_required}</span> Units
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => navigate('/donor/dashboard/requests')}
                    className="hover:bg-bg-elevated transition-colors"
                  >
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

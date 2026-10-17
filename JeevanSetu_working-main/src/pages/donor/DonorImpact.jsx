import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { 
  Award, 
  Calendar, 
  MapPin, 
  Droplet,
  Sparkles,
  Heart,
  TrendingUp
} from 'lucide-react';

const quotes = [
  "The blood you donate gives someone another chance at life. One day that someone may be a close relative, a friend, a loved one—or even you.",
  "To give blood is to give a family member their father, mother, sister, or brother back. It is a gift like no other.",
  "A single drop of blood can create a wave of hope. Thank you for being a lifeline.",
  "Your donation is a small act of kindness that makes the biggest difference to Thalassemia patients.",
  "The gift of blood is the gift of life. There is no substitute for your generosity."
];

export default function DonorImpact() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState([]);
  const [totalDonations, setTotalDonations] = useState(0);
  const [randomQuote, setRandomQuote] = useState('');
  const [livesSavedDisplay, setLivesSavedDisplay] = useState(0);

  const fetchImpactData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const isDemo = user.id.startsWith('demo-');
      let donationList = [];
      let total = 0;

      if (isDemo) {
        const localDonations = localStorage.getItem('jeevansetu_demo_donations') || '[]';
        donationList = JSON.parse(localDonations);
        const cachedProfile = localStorage.getItem('jeevansetu_demo_donor_profile');
        if (cachedProfile) {
          total = JSON.parse(cachedProfile).total_donations || donationList.length;
        } else {
          total = donationList.length;
        }
      } else {
        const { data, error } = await supabase
          .from('donations')
          .select('donation_date, hospital_name, units_donated')
          .eq('donor_id', user.id)
          .order('donation_date', { ascending: false });

        if (error) throw error;
        donationList = data || [];
        
        // Also fetch profile for total_donations
        const { data: prof, error: profErr } = await supabase
          .from('donor_profiles')
          .select('total_donations')
          .eq('id', user.id)
          .single();
        if (!profErr && prof) {
          total = prof.total_donations || donationList.length;
        } else {
          total = donationList.length;
        }
      }

      setDonations(donationList);
      setTotalDonations(total);
      
    } catch (err) {
      console.error('Error fetching impact data:', err);
      toast.error('Failed to load impact milestones.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Select quote and trigger animation of lives saved
  useEffect(() => {
    // Choose random quote
    const qIndex = Math.floor(Math.random() * quotes.length);
    const timer = setTimeout(() => {
      setRandomQuote(quotes[qIndex]);
      fetchImpactData();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchImpactData]);

  // Handle number ticking animation for premium UI feel
  useEffect(() => {
    if (loading) return;
    const target = totalDonations * 3;
    if (target === 0) {
      return;
    }
    
    let start = 0;
    const duration = 1000; // ms
    const increment = Math.ceil(target / (duration / 30));
    
    const interval = setInterval(() => {
      start += increment;
      if (start >= target) {
        setLivesSavedDisplay(target);
        clearInterval(interval);
      } else {
        setLivesSavedDisplay(start);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [totalDonations, loading]);

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isRareGroup = ['O-', 'B-', 'AB-'].includes(user?.user_metadata?.blood_group);

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
        title="My Impact" 
        subtitle="Visualize how your blood and stem cell donations are bringing hope to Thalassemia patients." 
      />

      {/* Quote Banner */}
      <div className="bg-brand-muted/20 border border-brand-primary/20 p-5 rounded-lg text-center relative overflow-hidden">
        <div className="absolute top-2 right-2 text-brand-primary/25">
          <Sparkles size={24} />
        </div>
        <p className="text-sm italic text-text-primary max-w-2xl mx-auto leading-relaxed">
          "{randomQuote}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Animated Counter Card */}
        <div className="bg-bg-card border border-border p-6 rounded-lg shadow-sm flex flex-col justify-center items-center text-center space-y-4 min-h-[220px]">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
            <Heart size={24} />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">Lives Saved & Impacted</h4>
            <div className="text-5xl font-black mt-2 text-brand-primary tracking-tight select-none">
              {livesSavedDisplay}
            </div>
            <p className="text-[10px] text-text-secondary mt-1 max-w-xs mx-auto">
              Every blood donation yields components that can help up to 3 separate patient transfusions.
            </p>
          </div>
        </div>

        {/* Info Cards / Rarity Notification */}
        <div className="md:col-span-2 space-y-4">
          {/* Rarity warning badge */}
          {isRareGroup && (
            <div className="bg-purple-muted/20 border border-purple-accent/30 p-5 rounded-lg flex items-start gap-3">
              <Award className="text-purple-accent shrink-0 mt-0.5" size={24} />
              <div>
                <h4 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  ⭐ Critical Blood Group Rarity
                </h4>
                <p className="text-xs text-text-secondary mt-1">
                  Your blood group is <span className="text-purple-accent font-bold">{user?.user_metadata?.blood_group}</span>, which is extremely rare. Patients of compatible types rely heavily on your availability.
                </p>
              </div>
            </div>
          )}

          <div className="bg-bg-card border border-border p-6 rounded-lg shadow-sm space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <TrendingUp size={14} className="text-info" />
              Donation Milestones reached
            </h3>
            <p className="text-xs text-text-secondary">
              You have completed <span className="font-semibold text-text-primary">{totalDonations} donations</span> since registering on JeevanSetu. Every single donation is a step towards a healthier tomorrow for Thalassemia patients.
            </p>
          </div>
        </div>

      </div>

      {/* Donation Timeline */}
      <div className="bg-bg-card border border-border p-6 rounded-lg shadow-sm space-y-6">
        <h3 className="text-sm font-semibold text-text-primary">
          My Donation Milestones
        </h3>

        {donations.length === 0 ? (
          <EmptyState 
            icon={<Droplet size={40} className="text-brand-primary/50" />}
            title="No Donations Recorded Yet"
            description="Your milestone timeline will render as soon as you complete your first donation request."
          />
        ) : (
          <div className="relative border-l-2 border-border-subtle ml-3 pl-6 space-y-6 py-2">
            {donations.map((don, index) => (
              <div key={index} className="relative">
                {/* Timeline node dot */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-brand-primary border-4 border-bg-card shadow-sm" />
                
                <div className="bg-bg-secondary p-4 rounded border border-border-subtle space-y-2 max-w-2xl">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-brand-primary">
                      {don.units_donated} Unit(s) Donated
                    </span>
                    <span className="text-[10px] text-text-secondary flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDateStr(don.donation_date)}
                    </span>
                  </div>
                  <p className="text-xs text-text-primary flex items-center gap-1.5">
                    <MapPin size={12} className="text-text-secondary" />
                    Hospital: <span className="font-semibold">{don.hospital_name}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import BloodGroupBadge from '../../components/ui/BloodGroupBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Search, MapPin, Send, CheckCircle2, Navigation, AlertTriangle } from 'lucide-react';

let notificationCounter = 0;
const generateNotificationId = () => {
  notificationCounter += 1;
  return `notif-mock-${Date.now()}-${notificationCounter}`;
};

const compatibilityMap = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

export default function PatientDonors() {
  const { user } = useAuth();
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState(null);
  const [donorNotificationsMap, setDonorNotificationsMap] = useState({});

  // Filter States
  const [filterBloodGroup, setFilterBloodGroup] = useState('compatible');
  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterWillingToTravel, setFilterWillingToTravel] = useState(false);

  // Mask full name for privacy: "John Smith" -> "John S."
  const maskName = (fullName) => {
    if (!fullName) return 'Donor';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  const loadData = useCallback(async () => {
    if (!user) return;
    // Defer state update to avoid synchronous setState inside useEffect body
    await Promise.resolve();
    setLoading(true);
    try {
      // Fetch patient's actual blood group from database profiles table
      const { data: patientProfile, error: patBloodErr } = await supabase
        .from('profiles')
        .select('blood_group')
        .eq('id', user.id)
        .single();

      if (patBloodErr) {
        console.warn('Error fetching patient blood group from DB, using fallback metadata:', patBloodErr);
      }

      const patientBlood = patientProfile?.blood_group || user.user_metadata?.blood_group || 'AB+';
      const compatibleGroups = compatibilityMap[patientBlood] || [patientBlood];
      
      // Determine final blood groups to filter by
      let bloodGroupsToQuery = [];
      if (filterBloodGroup === 'compatible') {
        bloodGroupsToQuery = compatibleGroups;
      } else {
        bloodGroupsToQuery = [filterBloodGroup];
      }

      // Query real database
      // Fetch patient's active request first
      const { data: reqs, error: reqError } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['Open', 'Donor Found'])
        .order('created_at', { ascending: false });

      if (!reqError && reqs && reqs.length > 0) {
        setActiveRequest(reqs[0]);
        
        // Fetch notifications already sent for this request to highlight "Request Sent"
        const { data: sentNotifs } = await supabase
          .from('donor_notifications')
          .select('donor_id, status')
          .eq('request_id', reqs[0].id);
        
        if (sentNotifs) {
          const mapping = {};
          sentNotifs.forEach(n => {
            mapping[n.donor_id] = n.status;
          });
          setDonorNotificationsMap(mapping);
        }
      } else {
        setActiveRequest(null);
      }

      // Query available profiles of role = 'donor'
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          blood_group,
          city,
          state,
          donor_profiles!inner (
            is_available,
            is_deferred,
            next_eligible_date,
            willing_to_travel,
            max_travel_distance_km
          )
        `)
        .eq('role', 'donor')
        .eq('is_active', true)
        .eq('donor_profiles.is_available', true)
        .eq('donor_profiles.is_deferred', false)
        .in('blood_group', bloodGroupsToQuery);

      if (filterCity) {
        query = query.ilike('city', `%${filterCity}%`);
      }
      if (filterState) {
        query = query.ilike('state', `%${filterState}%`);
      }
      if (filterWillingToTravel) {
        query = query.eq('donor_profiles.willing_to_travel', true);
      }

      const { data: donorProfiles, error: donorError } = await query;
      if (donorError) throw donorError;

      // Filter out donors who are not yet eligible (next_eligible_date > today)
      const todayStr = new Date().toISOString().split('T')[0];
      const eligibleDonors = (donorProfiles || []).filter(d => {
        const nextEligible = d.donor_profiles?.next_eligible_date;
        return !nextEligible || nextEligible <= todayStr;
      });

      setDonors(eligibleDonors);
    } catch (err) {
      console.error('Error fetching donors:', err);
      toast.error('Failed to search compatible donors.');
    } finally {
      setLoading(false);
    }
  }, [user, filterBloodGroup, filterState, filterCity, filterWillingToTravel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleRequestDonor = async (donor) => {
    if (!activeRequest) {
      toast.error('No active request found! Please create a blood request first.');
      return;
    }

    try {
      // Check if there is an existing notification record for this request and donor
      const { data: existingNotif } = await supabase
        .from('donor_notifications')
        .select('id')
        .eq('request_id', activeRequest.id)
        .eq('donor_id', donor.id)
        .maybeSingle();

      let error;
      if (existingNotif) {
        // Update existing notification to Pending
        const { error: updateErr } = await supabase
          .from('donor_notifications')
          .update({ status: 'Pending' })
          .eq('id', existingNotif.id);
        error = updateErr;
      } else {
        // Insert new notification
        const { error: insertErr } = await supabase
          .from('donor_notifications')
          .insert({
            request_id: activeRequest.id,
            donor_id: donor.id,
            patient_id: user.id,
            status: 'Pending'
          });
        error = insertErr;
      }

      if (error) throw error;

      // Automatically update Status to 'Donor Found' if request was 'Open'
      if (activeRequest.status === 'Open') {
        await supabase
          .from('blood_requests')
          .update({ status: 'Donor Found' })
          .eq('id', activeRequest.id);
      }

      setDonorNotificationsMap(prev => ({
        ...prev,
        [donor.id]: 'Pending'
      }));
      toast.success(`Request sent to ${maskName(donor.full_name)}!`);
    } catch (err) {
      console.error('Request donor error:', err);
      toast.error('Failed to notify donor.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Find Compatible Donors" 
        subtitle="Search voluntary blood donors by group, proximity, and check real-time availability."
      />

      {/* FILTER SEARCH FORM */}
      <form onSubmit={handleSearchSubmit} className="bg-bg-card border border-border-main p-5 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          
          <Select
            label="Blood Group"
            id="filterBloodGroup"
            value={filterBloodGroup}
            onChange={(e) => setFilterBloodGroup(e.target.value)}
            options={[
              { value: 'compatible', label: 'All Compatible Donors' },
              { value: 'A+', label: 'A+' },
              { value: 'A-', label: 'A-' },
              { value: 'B+', label: 'B+' },
              { value: 'B-', label: 'B-' },
              { value: 'AB+', label: 'AB+' },
              { value: 'AB-', label: 'AB-' },
              { value: 'O+', label: 'O+' },
              { value: 'O-', label: 'O-' }
            ]}
          />

          <Input
            label="City"
            id="filterCity"
            placeholder="e.g. Mumbai"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          />

          <Input
            label="State"
            id="filterState"
            placeholder="e.g. Maharashtra"
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
          />

          <div className="flex gap-2 w-full">
            <Button variant="outline" className="w-full justify-center" type="submit">
              <Search size={16} className="mr-1.5" /> Search
            </Button>
          </div>
        </div>

        {/* Travel Toggle Filter */}
        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border-subtle">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-text-secondary">
            <input
              type="checkbox"
              checked={filterWillingToTravel}
              onChange={(e) => setFilterWillingToTravel(e.target.checked)}
              className="w-4 h-4 text-purple-accent bg-bg-input border-border-main rounded focus:ring-purple-accent"
            />
            <span>Show Only Donors Willing to Travel</span>
          </label>
        </div>
      </form>

      {/* ACTIVE REQUEST STATE WARNING */}
      {!activeRequest && !loading && (
        <div className="bg-warning/10 border border-warning/20 p-4 rounded-lg flex gap-3 text-warning text-xs items-start leading-relaxed">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No Active Request Raised</p>
            <p className="text-text-secondary mt-0.5">
              You must raise a blood request before inviting donors. Go to the <span className="underline cursor-pointer font-bold" onClick={() => setFilterBloodGroup('compatible')}>Requests page</span> to create one first.
            </p>
          </div>
        </div>
      )}

      {/* DONORS CARDS GRID */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : donors.length === 0 ? (
        <div className="bg-bg-card border border-border-main p-12 text-center rounded-lg text-text-secondary">
          No available compatible donors match your search parameters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {donors.map((donor) => {
            const notifStatus = donorNotificationsMap[donor.id];
            const isTraveler = donor.donor_profiles?.willing_to_travel;
            
            return (
              <div 
                key={donor.id} 
                className="bg-bg-card border border-border-main rounded-lg p-5 shadow-sm flex flex-col justify-between gap-4 hover:border-border-subtle transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-text-primary">
                      {maskName(donor.full_name)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <MapPin size={12} className="text-text-muted" />
                      <span>{donor.city}, {donor.state}</span>
                    </div>
                  </div>
                  <BloodGroupBadge bloodGroup={donor.blood_group} />
                </div>

                {/* Eligibility and travel status details */}
                <div className="flex flex-wrap gap-2 py-2 border-t border-b border-border-subtle">
                  <span className="text-[10px] bg-brand-muted text-brand-primary border border-brand-primary/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    Eligible to Donate
                  </span>
                  {isTraveler && (
                    <span className="text-[10px] bg-info/10 text-info border border-info/20 px-2 py-0.5 rounded font-bold uppercase tracking-wider flex items-center gap-1">
                      <Navigation size={9} />
                      Willing to Travel
                    </span>
                  )}
                </div>

                <div className="w-full">
                  {notifStatus === 'Pending' && (
                    <Button 
                      variant="outline" 
                      disabled={true} 
                      className="w-full text-brand-primary border-brand-primary/20 bg-brand-muted/20 gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Request Sent ✓
                    </Button>
                  )}
                  {notifStatus === 'Accepted' && (
                    <Button 
                      variant="outline" 
                      disabled={true} 
                      className="w-full text-success border-success/20 bg-success/10 gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Accepted ✓
                    </Button>
                  )}
                  {notifStatus === 'Declined' && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        disabled={true} 
                        className="w-1/2 text-error border-error/20 bg-error/10 gap-1.5 text-xs justify-center"
                      >
                        Declined ✕
                      </Button>
                      <Button 
                        variant="patient" 
                        onClick={() => handleRequestDonor(donor)} 
                        disabled={!activeRequest}
                        className="w-1/2 text-xs justify-center"
                      >
                        Resend
                      </Button>
                    </div>
                  )}
                  {!notifStatus && (
                    <Button 
                      variant="patient" 
                      onClick={() => handleRequestDonor(donor)} 
                      disabled={!activeRequest}
                      className="w-full gap-1.5"
                    >
                      <Send size={14} /> Request This Donor
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import BloodGroupBadge from '../../components/ui/BloodGroupBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import { 
  Phone, 
  MapPin, 
  Check, 
  X, 
  Calendar, 
  Heart, 
  AlertCircle,
  Inbox,
  Users
} from 'lucide-react';

const donationSchema = zod.object({
  donation_date: zod.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please select a valid date',
  }),
  units_donated: zod.string()
    .refine((val) => {
      const parsed = parseFloat(val);
      return !isNaN(parsed) && parsed > 0 && parsed <= 5;
    }, { message: 'Units must be between 0.5 and 5' }),
  notes: zod.string().optional()
});

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

export default function DonorRequests() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [communityRequests, setCommunityRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('direct'); // 'direct' or 'community'
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [submittingDonation, setSubmittingDonation] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      donation_date: new Date().toISOString().split('T')[0],
      units_donated: '1',
      notes: ''
    }
  });

  const maskName = (fullName) => {
    if (!fullName) return 'Patient';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      // 1. Fetch donor profile to get blood group
      const { data: donorProfile, error: profileErr } = await supabase
        .from('profiles')
        .select('blood_group')
        .eq('id', user.id)
        .single();
      
      if (profileErr) throw profileErr;
      const donorBloodGroup = donorProfile?.blood_group;

      // 2. Fetch direct donor notifications
      const { data: notifData, error: notifErr } = await supabase
        .from('donor_notifications')
        .select(`
          id,
          request_id,
          donor_id,
          patient_id,
          status,
          notified_at,
          blood_requests (
            id,
            blood_group_needed,
            units_required,
            hospital_name,
            hospital_address,
            hospital_city,
            hospital_state,
            required_by_date,
            urgency_level,
            contact_number,
            additional_notes
          ),
          profiles!patient_id (
            full_name
          )
        `)
        .eq('donor_id', user.id)
        .order('notified_at', { ascending: false });

      if (notifErr) throw notifErr;
      setNotifications(notifData || []);

      // 3. Fetch open community requests that match blood compatibility
      const compatibleGroups = canDonateTo[donorBloodGroup] || [];
      const { data: openReqData, error: reqErr } = await supabase
        .from('blood_requests')
        .select(`
          id,
          patient_id,
          blood_group_needed,
          units_required,
          hospital_name,
          hospital_address,
          hospital_city,
          hospital_state,
          required_by_date,
          urgency_level,
          status,
          contact_number,
          additional_notes,
          profiles!patient_id (
            full_name
          )
        `)
        .eq('status', 'Open')
        .in('blood_group_needed', compatibleGroups)
        .order('created_at', { ascending: false });

      if (reqErr) throw reqErr;

      // Filter out requests for which this donor already has a notification record (accepted/declined/etc.)
      const existingRequestIds = new Set((notifData || []).map(n => n.request_id));
      const filteredCommunity = (openReqData || []).filter(
        req => !existingRequestIds.has(req.id) && req.patient_id !== user.id
      );
      setCommunityRequests(filteredCommunity);
    } catch (err) {
      console.error('Error fetching donation requests:', err);
      toast.error('Failed to load incoming requests.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 0);

    if (!user) return () => clearTimeout(timer);

    // Subscribe to notifications changes
    const notifChannel = supabase
      .channel('donor_notifications_feed')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'donor_notifications', 
          filter: `donor_id=eq.${user.id}` 
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    // Subscribe to open community requests changes
    const reqChannel = supabase
      .channel('community_requests_feed')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'blood_requests'
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(reqChannel);
    };
  }, [user, fetchRequests]);

  const handleAccept = async (notif) => {
    try {
      const { error: notifErr } = await supabase
        .from('donor_notifications')
        .update({ status: 'Accepted', responded_at: new Date().toISOString() })
        .eq('id', notif.id);
      
      if (notifErr) throw notifErr;
      
      toast.success('Request accepted! Patient details unlocked.');
      fetchRequests();
    } catch (err) {
      console.error('Error accepting request:', err);
      toast.error('Failed to accept request.');
    }
  };

  const handleDecline = async (notif) => {
    try {
      const { error } = await supabase
        .from('donor_notifications')
        .update({ status: 'Declined', responded_at: new Date().toISOString() })
        .eq('id', notif.id);

      if (error) throw error;
      toast.success('Request declined.');
      fetchRequests();
    } catch (err) {
      console.error('Error declining request:', err);
      toast.error('Failed to decline request.');
    }
  };

  const handleAcceptCommunity = async (req) => {
    try {
      // Insert a donor_notification row as Accepted - trigger handles the rest
      const { error: insertErr } = await supabase
        .from('donor_notifications')
        .insert({
          request_id: req.id,
          donor_id: user.id,
          patient_id: req.patient_id,
          status: 'Accepted',
          responded_at: new Date().toISOString()
        });

      if (insertErr) throw insertErr;

      toast.success('Request accepted! Patient details unlocked.');
      fetchRequests();
    } catch (err) {
      console.error('Error accepting community request:', err);
      toast.error('Failed to accept match.');
    }
  };

  const handleDeclineCommunity = async (req) => {
    try {
      // Hide request by inserting a Declined notification
      const { error } = await supabase
        .from('donor_notifications')
        .insert({
          request_id: req.id,
          donor_id: user.id,
          patient_id: req.patient_id,
          status: 'Declined',
          responded_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Match hidden.');
      fetchRequests();
    } catch (err) {
      console.error('Error declining community request:', err);
      toast.error('Failed to decline match.');
    }
  };

  const handleOpenDonateModal = (notif) => {
    setSelectedNotif(notif);
    reset({
      donation_date: new Date().toISOString().split('T')[0],
      units_donated: String(notif.blood_requests?.units_required || 1),
      notes: ''
    });
    setDonateModalOpen(true);
  };

  const onSubmitDonation = async (data) => {
    if (!selectedNotif) return;
    setSubmittingDonation(true);
    try {
      const payload = {
        donor_id: user.id,
        patient_id: selectedNotif.patient_id,
        request_id: selectedNotif.request_id,
        donation_date: data.donation_date,
        blood_group: selectedNotif.blood_requests?.blood_group_needed,
        units_donated: parseFloat(data.units_donated),
        hospital_name: selectedNotif.blood_requests?.hospital_name,
        notes: data.notes || '',
        status: 'Completed'
      };

      const { error: insertErr } = await supabase
        .from('donations')
        .insert(payload);

      if (insertErr) throw insertErr;

      const { error: updateErr } = await supabase
        .from('donor_notifications')
        .update({ status: 'Fulfilled' })
        .eq('id', selectedNotif.id);

      if (updateErr) throw updateErr;

      toast.success('Thank you! Donation logged successfully.');
      setDonateModalOpen(false);
      fetchRequests();
    } catch (err) {
      console.error('Error logging donation:', err);
      toast.error('Failed to log donation.');
    } finally {
      setSubmittingDonation(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Filter direct requests
  const activeDirectRequests = notifications.filter(n => n.status !== 'Fulfilled' && n.status !== 'Declined');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Donation Requests" 
        subtitle="Manage request notifications matching your blood group compatibility" 
      />

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('direct')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'direct'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Inbox size={16} />
          Direct Invitations ({activeDirectRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('community')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'community'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <Users size={16} />
          Community Matches ({communityRequests.length})
        </button>
      </div>

      {activeTab === 'direct' ? (
        activeDirectRequests.length === 0 ? (
          <EmptyState 
            icon={<Heart size={40} className="text-brand-primary" />}
            title="No Direct Invitations"
            description="You have no pending direct invitations from patients at the moment."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeDirectRequests.map((notif) => {
              const req = notif.blood_requests;
              const patientName = maskName(notif.profiles?.full_name);
              const isAccepted = notif.status === 'Accepted';
              const isNearby = req?.hospital_city?.toLowerCase() === user.user_metadata?.city?.toLowerCase();

              return (
                <div 
                  key={notif.id}
                  className={`bg-bg-card border rounded-lg p-6 transition-all ${
                    isAccepted ? 'border-brand-primary/50' : 'border-border'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <BloodGroupBadge bloodGroup={req?.blood_group_needed} />
                        <UrgencyBadge level={req?.urgency_level} />
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          isNearby 
                            ? 'bg-success/15 text-success border-success/30' 
                            : 'bg-info/15 text-info border-info/30'
                        }`}>
                          {isNearby ? 'Nearby (Same City)' : 'Requires Travel'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-text-primary">
                          Hospital: {req?.hospital_name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Requested by patient: <span className="font-semibold text-text-primary">{patientName}</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Units Required: <span className="font-semibold text-text-primary">{req?.units_required}</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                          <Calendar size={12} />
                          Required by: <span className="font-semibold text-text-primary">{formatDateStr(req?.required_by_date)}</span>
                        </p>
                      </div>

                      {req?.additional_notes && (
                        <div className="text-xs text-text-secondary bg-bg-secondary p-3 rounded border border-border-subtle max-w-2xl">
                          <span className="font-semibold text-text-primary">Notes:</span> {req.additional_notes}
                        </div>
                      )}

                      {isAccepted && (
                        <div className="mt-4 p-4 bg-brand-muted/20 border border-brand-primary/20 rounded-md space-y-2 max-w-xl">
                          <h4 className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                            <Check size={14} />
                            Accepted - Patient Contact Details
                          </h4>
                          <p className="text-xs text-text-primary flex items-center gap-2">
                            <Phone size={12} className="text-text-secondary" />
                            Phone: <a href={`tel:${req?.contact_number}`} className="font-bold underline text-brand-primary">{req?.contact_number}</a>
                          </p>
                          <p className="text-xs text-text-primary flex items-start gap-2">
                            <MapPin size={12} className="text-text-secondary mt-0.5 shrink-0" />
                            Address: <span className="font-semibold">{req?.hospital_address}, {req?.hospital_city}, {req?.hospital_state}</span>
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0 md:w-44">
                      {!isAccepted ? (
                        <>
                          <Button 
                            variant="primary" 
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => handleAccept(notif)}
                          >
                            <Check size={16} />
                            Accept Request
                          </Button>
                          <Button 
                            variant="secondary" 
                            className="w-full flex items-center justify-center gap-2 text-error hover:bg-error/15 border-error/20"
                            onClick={() => handleDecline(notif)}
                          >
                            <X size={16} />
                            Decline
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            variant="primary" 
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => handleOpenDonateModal(notif)}
                          >
                            <Heart size={16} />
                            Mark as Donated
                          </Button>
                          <div className="text-center text-[10px] text-text-muted mt-1">
                            Please mark as donated only after completing donation
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        communityRequests.length === 0 ? (
          <EmptyState 
            icon={<Inbox size={40} className="text-text-muted" />}
            title="No Matching Community Requests"
            description="There are currently no matching open requests from the general community."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {communityRequests.map((req) => {
              const patientName = maskName(req.profiles?.full_name);
              const isNearby = req.hospital_city?.toLowerCase() === user.user_metadata?.city?.toLowerCase();

              return (
                <div 
                  key={req.id}
                  className="bg-bg-card border border-border rounded-lg p-6 transition-all hover:border-border-focus"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <BloodGroupBadge bloodGroup={req.blood_group_needed} />
                        <UrgencyBadge level={req.urgency_level} />
                        <span className={`text-[10px] px-2 py-0.5 rounded font-semibold border ${
                          isNearby 
                            ? 'bg-success/15 text-success border-success/30' 
                            : 'bg-info/15 text-info border-info/30'
                        }`}>
                          {isNearby ? 'Nearby (Same City)' : 'Requires Travel'}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-text-primary">
                          Hospital: {req.hospital_name}
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Requested by patient: <span className="font-semibold text-text-primary">{patientName}</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Units Required: <span className="font-semibold text-text-primary">{req.units_required}</span>
                        </p>
                        <p className="text-xs text-text-secondary mt-0.5 flex items-center gap-1.5">
                          <Calendar size={12} />
                          Required by: <span className="font-semibold text-text-primary">{formatDateStr(req.required_by_date)}</span>
                        </p>
                      </div>

                      {req.additional_notes && (
                        <div className="text-xs text-text-secondary bg-bg-secondary p-3 rounded border border-border-subtle max-w-2xl">
                          <span className="font-semibold text-text-primary">Notes:</span> {req.additional_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0 md:w-44">
                      <Button 
                        variant="primary" 
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handleAcceptCommunity(req)}
                      >
                        <Check size={16} />
                        Accept Request
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="w-full flex items-center justify-center gap-2 text-error hover:bg-error/15 border-error/20"
                        onClick={() => handleDeclineCommunity(req)}
                      >
                        <X size={16} />
                        Decline/Hide
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Donation log modal */}
      <Modal 
        isOpen={donateModalOpen} 
        onClose={() => setDonateModalOpen(false)}
        title="Mark Donation as Completed"
      >
        <form onSubmit={handleSubmit(onSubmitDonation)} className="space-y-4">
          <div className="flex items-center gap-2 bg-info/10 text-info p-3 rounded-md text-xs border border-info/20">
            <AlertCircle size={16} className="shrink-0" />
            <p>
              By marking this donation as complete, your next donation eligibility date will be locked for 90 days.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Donation Date
            </label>
            <input 
              type="date"
              className="w-full bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
              {...register('donation_date')}
            />
            {errors.donation_date && (
              <p className="text-xs text-error mt-1">{errors.donation_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Units Donated
            </label>
            <input 
              type="number"
              step="0.5"
              min="0.5"
              max="5"
              className="w-full bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
              {...register('units_donated')}
            />
            {errors.units_donated && (
              <p className="text-xs text-error mt-1">{errors.units_donated.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              Additional Notes (Optional)
            </label>
            <textarea 
              rows="3"
              className="w-full bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none resize-none"
              placeholder="E.g. Nurse details, hemoglobin status, etc."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setDonateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={submittingDonation}
            >
              {submittingDonation ? 'Logging...' : 'Confirm Donation'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

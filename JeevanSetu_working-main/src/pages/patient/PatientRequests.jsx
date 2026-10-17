import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import BloodGroupBadge from '../../components/ui/BloodGroupBadge';
import UrgencyBadge from '../../components/ui/UrgencyBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, XCircle, Eye } from 'lucide-react';

const requestSchema = zod.object({
  blood_group_needed: zod.string().min(1, 'Blood group is required'),
  units_required: zod.string()
    .refine((val) => {
      const parsed = parseInt(val);
      return !isNaN(parsed) && parsed >= 1 && parsed <= 10;
    }, { message: 'Please request between 1 and 10 units' }),
  hospital_name: zod.string().min(3, 'Hospital name is required'),
  hospital_address: zod.string().min(5, 'Hospital address is required'),
  hospital_city: zod.string().min(2, 'City is required'),
  hospital_state: zod.string().min(2, 'State is required'),
  required_by_date: zod.string().refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(val) >= today;
  }, { message: 'Date cannot be in the past' }),
  urgency_level: zod.enum(['Emergency', 'Urgent', 'Routine'], {
    errorMap: () => ({ message: 'Please select an urgency level' }),
  }),
  contact_number: zod.string().min(10, 'Contact number must be at least 10 digits'),
  additional_notes: zod.string().optional()
});

let requestCounter = 0;
const generateRequestId = () => {
  requestCounter += 1;
  return `req-demo-${Date.now()}-${requestCounter}`;
};

export default function PatientRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  
  // Active selection states
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      blood_group_needed: user?.user_metadata?.blood_group || '',
      contact_number: user?.user_metadata?.phone || '',
      urgency_level: 'Urgent'
    }
  });

  const fetchRequests = useCallback(async () => {
    if (!user) return;
    // Defer execution to avoid synchronous setState inside useEffect body
    await Promise.resolve();
    setLoading(true);
    try {
      // Fetch from Supabase
      const { data, error } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error fetching requests:', err);
      toast.error('Failed to load blood requests.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 0);
    // Realtime channel
    const channel = supabase
      .channel('patient_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests', filter: `patient_id=eq.${user.id}` }, () => {
        fetchRequests();
      })
      .subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [user, fetchRequests]);

  const onCreateRequest = async (data) => {
    setSubmitting(true);
    try {
      const newReq = {
        patient_id: user.id,
        blood_group_needed: data.blood_group_needed,
        units_required: parseInt(data.units_required),
        hospital_name: data.hospital_name,
        hospital_address: data.hospital_address,
        hospital_city: data.hospital_city,
        hospital_state: data.hospital_state,
        required_by_date: data.required_by_date,
        urgency_level: data.urgency_level,
        contact_number: data.contact_number,
        additional_notes: data.additional_notes || '',
        status: 'Open'
      };

      const { error } = await supabase
        .from('blood_requests')
        .insert(newReq);
      
      if (error) throw error;
      toast.success('Blood request raised successfully! Compatible donors have been alerted.');
      fetchRequests();

      setCreateModalOpen(false);
      reset();
    } catch (err) {
      console.error('Request creation error:', err);
      toast.error(err.message || 'Failed to create request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!selectedRequest) return;
    try {
      const { error } = await supabase
        .from('blood_requests')
        .update({ status: 'Cancelled' })
        .eq('id', selectedRequest.id);
      
      if (error) throw error;
      toast.success('Request cancelled successfully.');
      fetchRequests();

      setCancelDialogOpen(false);
      setSelectedRequest(null);
    } catch (err) {
      console.error('Cancel request error:', err);
      toast.error('Failed to cancel request.');
    }
  };

  const columns = [
    {
      header: 'Request ID',
      render: (row) => <span className="font-semibold text-text-secondary font-mono">#{row.id.substring(0, 8)}</span>
    },
    {
      header: 'Blood Group',
      render: (row) => <BloodGroupBadge bloodGroup={row.blood_group_needed} />
    },
    {
      header: 'Units',
      accessor: 'units_required'
    },
    {
      header: 'Hospital',
      render: (row) => <span className="truncate max-w-[150px] inline-block">{row.hospital_name}</span>
    },
    {
      header: 'City',
      accessor: 'hospital_city'
    },
    {
      header: 'Urgency',
      render: (row) => <UrgencyBadge level={row.urgency_level} />
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Required By',
      render: (row) => <span>{new Date(row.required_by_date).toLocaleDateString('en-GB')}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedRequest(row);
              setViewModalOpen(true);
            }}
            title="View Details"
          >
            <Eye size={14} />
          </Button>
          {(row.status === 'Open' || row.status === 'Donor Found') && (
            <Button
              variant="outline"
              size="sm"
              className="border-error/30 text-error hover:bg-error/10"
              onClick={() => {
                setSelectedRequest(row);
                setCancelDialogOpen(true);
              }}
              title="Cancel Request"
            >
              <XCircle size={14} />
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Blood Requests Log" 
        subtitle="View history, track responses, and manage urgent blood donation notifications." 
        action={
          <Button variant="patient" onClick={() => {
            reset({
              blood_group_needed: user?.user_metadata?.blood_group || '',
              contact_number: user?.user_metadata?.phone || '',
              urgency_level: 'Urgent'
            });
            setCreateModalOpen(true);
          }}>
            <Plus size={16} className="mr-1.5" /> Raise Request
          </Button>
        }
      />

      <DataTable 
        columns={columns}
        data={requests}
        loading={loading}
        emptyMessage="No blood requests found. Tap 'Raise Request' to create one."
      />

      {/* CREATE MODAL */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Raise New Blood Request">
        <form onSubmit={handleSubmit(onCreateRequest)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Blood Group Needed"
              id="blood_group_needed"
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
              error={errors.blood_group_needed}
              {...register('blood_group_needed')}
            />
            <Input
              label="Units Required"
              id="units_required"
              type="number"
              placeholder="e.g. 2"
              error={errors.units_required}
              {...register('units_required')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hospital / Blood Bank Name"
              id="hospital_name"
              placeholder="e.g. Lilavati Hospital"
              error={errors.hospital_name}
              {...register('hospital_name')}
            />
            <Input
              label="Contact Mobile"
              id="contact_number"
              placeholder="9876543210"
              error={errors.contact_number}
              {...register('contact_number')}
            />
          </div>

          <div className="md:col-span-2">
            <Input
              label="Hospital Address"
              id="hospital_address"
              placeholder="Full street address and landmark"
              error={errors.hospital_address}
              {...register('hospital_address')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="City"
              id="hospital_city"
              placeholder="Mumbai"
              error={errors.hospital_city}
              {...register('hospital_city')}
            />
            <Input
              label="State"
              id="hospital_state"
              placeholder="Maharashtra"
              error={errors.hospital_state}
              {...register('hospital_state')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Required By Date"
              id="required_by_date"
              type="date"
              error={errors.required_by_date}
              {...register('required_by_date')}
            />
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase">Urgency Level</label>
              <div className="flex gap-4 pt-1">
                {['Emergency', 'Urgent', 'Routine'].map((lvl) => (
                  <label key={lvl} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="radio"
                      value={lvl}
                      className="w-4 h-4 text-purple-accent bg-bg-input border-border-main focus:ring-purple-accent"
                      {...register('urgency_level')}
                    />
                    <span className="text-xs text-text-primary font-medium">{lvl}</span>
                  </label>
                ))}
              </div>
              {errors.urgency_level && <p className="text-xs text-error mt-1">{errors.urgency_level.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="additional_notes" className="block text-xs font-semibold text-text-secondary uppercase mb-2">Additional Medical Instructions (Optional)</label>
            <textarea
              id="additional_notes"
              rows={3}
              placeholder="Any specific antibodies test results, donor matching details etc."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] p-3 text-xs focus:outline-none focus:border-[#3ecf8e]"
              {...register('additional_notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="patient" type="submit" isLoading={submitting}>
              Publish Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* VIEW DETAILS MODAL */}
      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Blood Request details">
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div>
                <span className="text-[10px] text-text-muted font-mono block">ID: {selectedRequest.id}</span>
                <h3 className="text-base font-bold text-text-primary mt-1">
                  {selectedRequest.units_required} Units of {selectedRequest.blood_group_needed}
                </h3>
              </div>
              <div className="flex gap-2">
                <UrgencyBadge level={selectedRequest.urgency_level} />
                <StatusBadge status={selectedRequest.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-text-muted">Hospital / Blood Bank</p>
                <p className="font-semibold text-text-primary mt-0.5">{selectedRequest.hospital_name}</p>
              </div>
              <div>
                <p className="text-text-muted">Contact Number</p>
                <p className="font-semibold text-text-primary mt-0.5">{selectedRequest.contact_number}</p>
              </div>
              <div className="col-span-2">
                <p className="text-text-muted">Address</p>
                <p className="font-semibold text-text-primary mt-0.5 leading-relaxed">
                  {selectedRequest.hospital_address}, {selectedRequest.hospital_city}, {selectedRequest.hospital_state}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Required By</p>
                <p className="font-semibold text-text-primary mt-0.5">
                  {new Date(selectedRequest.required_by_date).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div>
                <p className="text-text-muted">Raised At</p>
                <p className="font-semibold text-text-primary mt-0.5">
                  {new Date(selectedRequest.created_at).toLocaleString('en-GB')}
                </p>
              </div>
            </div>

            {selectedRequest.additional_notes && (
              <div className="bg-bg-secondary p-3 rounded-lg border border-border-subtle">
                <p className="text-[10px] text-text-muted uppercase font-bold mb-1">Additional Notes</p>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">
                  {selectedRequest.additional_notes}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <Button variant="outline" onClick={() => setViewModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCEL CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={cancelDialogOpen}
        title="Cancel Blood Request?"
        message="Are you sure you want to cancel this blood request? Matching donors will no longer see this notification in their feed."
        confirmText="Yes, Cancel Request"
        cancelText="No, Keep Open"
        isDestructive={true}
        onConfirm={handleCancelConfirm}
        onCancel={() => {
          setCancelDialogOpen(false);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
}
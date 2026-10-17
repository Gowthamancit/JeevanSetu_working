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
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { Plus, Edit, Trash2, TrendingUp } from 'lucide-react';

const transfusionSchema = zod.object({
  transfusion_date: zod.string().min(1, 'Date is required'),
  blood_group_received: zod.string().min(1, 'Blood group is required'),
  units_received: zod.string().refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
    message: 'Units must be greater than 0'
  }),
  hospital_name: zod.string().min(3, 'Hospital name is required'),
  hemoglobin_before: zod.string().optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 2 && parseFloat(val) <= 20), {
      message: 'Hemoglobin before must be between 2 and 20 g/dL'
    }),
  hemoglobin_after: zod.string().optional()
    .refine(val => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 2 && parseFloat(val) <= 20), {
      message: 'Hemoglobin after must be between 2 and 20 g/dL'
    }),
  side_effects: zod.string().optional(),
  notes: zod.string().optional(),
});

let historyCounter = 0;
const generateHistoryId = () => {
  historyCounter += 1;
  return `h-mock-${Date.now()}-${historyCounter}`;
};

export default function PatientHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal controllers
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(transfusionSchema)
  });

  const prepareChartData = useCallback((dataList) => {
    // Sort ascending for chronological chart plotting
    const sorted = [...dataList].sort((a, b) => new Date(a.transfusion_date) - new Date(b.transfusion_date));
    const plotted = sorted.map(item => {
      const d = new Date(item.transfusion_date);
      return {
        date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        Hb_Before: item.hemoglobin_before ? parseFloat(item.hemoglobin_before) : null,
        Hb_After: item.hemoglobin_after ? parseFloat(item.hemoglobin_after) : null,
      };
    });
    setChartData(plotted);
  }, []);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    await Promise.resolve(); // Defer state update
    setLoading(true);
    try {
      // DB call
      const { data, error } = await supabase
        .from('transfusion_history')
        .select('*')
        .eq('patient_id', user.id)
        .order('transfusion_date', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
      prepareChartData(data || []);
    } catch (err) {
      console.error('History load error:', err);
      toast.error('Failed to load transfusion history.');
    } finally {
      setLoading(false);
    }
  }, [user, prepareChartData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHistory();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadHistory]);

  const handleOpenAdd = () => {
    setIsEditing(false);
    setSelectedRecord(null);
    reset({
      transfusion_date: new Date().toISOString().split('T')[0],
      blood_group_received: user?.user_metadata?.blood_group || 'AB+',
      units_received: '1',
      hospital_name: '',
      hemoglobin_before: '',
      hemoglobin_after: '',
      side_effects: '',
      notes: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (record) => {
    setIsEditing(true);
    setSelectedRecord(record);
    reset({
      transfusion_date: record.transfusion_date,
      blood_group_received: record.blood_group_received,
      units_received: String(record.units_received),
      hospital_name: record.hospital_name || '',
      hemoglobin_before: record.hemoglobin_before ? String(record.hemoglobin_before) : '',
      hemoglobin_after: record.hemoglobin_after ? String(record.hemoglobin_after) : '',
      side_effects: record.side_effects || '',
      notes: record.notes || ''
    });
    setModalOpen(true);
  };

  const handleFormSubmit = async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        patient_id: user.id,
        transfusion_date: data.transfusion_date,
        blood_group_received: data.blood_group_received,
        units_received: parseFloat(data.units_received),
        hospital_name: data.hospital_name,
        hemoglobin_before: data.hemoglobin_before ? parseFloat(data.hemoglobin_before) : null,
        hemoglobin_after: data.hemoglobin_after ? parseFloat(data.hemoglobin_after) : null,
        side_effects: data.side_effects || '',
        notes: data.notes || '',
      };

      if (isEditing && selectedRecord) {
        const { error } = await supabase
          .from('transfusion_history')
          .update(payload)
          .eq('id', selectedRecord.id);
        
        if (error) throw error;
        toast.success('Transfusion log updated.');
      } else {
        const { error } = await supabase
          .from('transfusion_history')
          .insert(payload);
        
        if (error) throw error;
        toast.success('Transfusion record logged.');
      }
      loadHistory();
      setModalOpen(false);
    } catch (err) {
      console.error('Save log error:', err);
      toast.error('Failed to save transfusion log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedRecord) return;
    try {
      const { error } = await supabase
        .from('transfusion_history')
        .delete()
        .eq('id', selectedRecord.id);

      if (error) throw error;
      toast.success('Transfusion log deleted.');
      loadHistory();
      setDeleteDialogOpen(false);
      setSelectedRecord(null);
    } catch (err) {
      console.error('Delete log error:', err);
      toast.error('Failed to delete log.');
    }
  };

  const columns = [
    {
      header: 'Date',
      render: (row) => <span>{new Date(row.transfusion_date).toLocaleDateString('en-GB')}</span>
    },
    {
      header: 'Group',
      accessor: 'blood_group_received'
    },
    {
      header: 'Units',
      accessor: 'units_received'
    },
    {
      header: 'Hospital',
      accessor: 'hospital_name'
    },
    {
      header: 'Hb Before / After',
      render: (row) => (
        <span>
          {row.hemoglobin_before ? `${row.hemoglobin_before} g/dL` : '—'} /{' '}
          <span className="text-brand-primary font-bold">
            {row.hemoglobin_after ? `${row.hemoglobin_after} g/dL` : '—'}
          </span>
        </span>
      )
    },
    {
      header: 'Notes',
      render: (row) => <span className="text-text-secondary truncate max-w-[200px] inline-block">{row.notes || '—'}</span>
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleOpenEdit(row)}
            title="Edit Log"
          >
            <Edit size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-error/30 text-error hover:bg-error/10"
            onClick={() => {
              setSelectedRecord(row);
              setDeleteDialogOpen(true);
            }}
            title="Delete Log"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Transfusion Logs & Hb Visualizer" 
        subtitle="Record your blood transfusions, input hemoglobin readings, and track medical parameters over time." 
        action={
          <Button variant="patient" onClick={handleOpenAdd}>
            <Plus size={16} className="mr-1.5" /> Log Transfusion
          </Button>
        }
      />

      {/* RECHARTS CHART CARD */}
      {chartData.length > 0 && (
        <div className="bg-bg-card border border-border-main p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-brand-primary" size={18} />
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Hemoglobin (Hb) Levels Trend
            </h2>
          </div>
          
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#555555" 
                  tickLine={false}
                  tick={{ fill: '#a0a0a0', fontSize: 11 }}
                />
                <YAxis 
                  stroke="#555555" 
                  domain={[4, 16]} 
                  tickLine={false}
                  tick={{ fill: '#a0a0a0', fontSize: 11 }}
                  unit=" g/dL"
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1c1c1c', borderColor: '#2e2e2e', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#ededed', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0a0' }} />
                <Line 
                  type="monotone" 
                  dataKey="Hb_Before" 
                  stroke="#a78bfa" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', strokeWidth: 1 }}
                  activeDot={{ r: 6 }} 
                  name="Hb Before Transfusion"
                />
                <Line 
                  type="monotone" 
                  dataKey="Hb_After" 
                  stroke="#3ecf8e" 
                  strokeWidth={2.5}
                  dot={{ fill: '#10b981', strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                  name="Hb After Transfusion"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TABLE DATA */}
      <DataTable
        columns={columns}
        data={history}
        loading={loading}
        emptyMessage="No transfusion history logs created yet. Log your first transfusion above!"
      />

      {/* ADD/EDIT MODAL */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={isEditing ? 'Edit Transfusion Record' : 'Log Blood Transfusion'}
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Transfusion Date"
              id="transfusion_date"
              type="date"
              error={errors.transfusion_date}
              {...register('transfusion_date')}
            />
            <Select
              label="Blood Group Received"
              id="blood_group_received"
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
              error={errors.blood_group_received}
              {...register('blood_group_received')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Units Received"
              id="units_received"
              placeholder="e.g. 2"
              error={errors.units_received}
              {...register('units_received')}
            />
            <Input
              label="Hospital Name"
              id="hospital_name"
              placeholder="e.g. KEM Hospital"
              error={errors.hospital_name}
              {...register('hospital_name')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Hemoglobin Before (g/dL) (Optional)"
              id="hemoglobin_before"
              placeholder="e.g. 8.2"
              error={errors.hemoglobin_before}
              {...register('hemoglobin_before')}
            />
            <Input
              label="Hemoglobin After (g/dL) (Optional)"
              id="hemoglobin_after"
              placeholder="e.g. 9.5"
              error={errors.hemoglobin_after}
              {...register('hemoglobin_after')}
            />
          </div>

          <div>
            <label htmlFor="side_effects" className="block text-xs font-semibold text-text-secondary uppercase mb-2">Transfusion Side Effects (Optional)</label>
            <textarea
              id="side_effects"
              rows={2}
              placeholder="Itching, rashes, mild fever etc. Leave blank if none."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] p-3 text-xs focus:outline-none focus:border-[#3ecf8e]"
              {...register('side_effects')}
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-xs font-semibold text-text-secondary uppercase mb-2">Additional Notes (Optional)</label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Add details about next transfusion estimation, doctor comments etc."
              className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg text-[#ededed] p-3 text-xs focus:outline-none focus:border-[#3ecf8e]"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border-subtle">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="patient" type="submit" isLoading={submitting}>
              {isEditing ? 'Save Changes' : 'Log Record'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete Transfusion Record?"
        message="Are you sure you want to delete this log? This will remove the data point from your Hemoglobin trend chart permanently."
        confirmText="Delete Record"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setSelectedRecord(null);
        }}
      />
    </div>
  );
}

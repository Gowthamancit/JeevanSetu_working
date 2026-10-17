import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import BloodGroupBadge from '../../components/ui/BloodGroupBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Heart, Award, Calendar, CheckCircle } from 'lucide-react';

export default function DonorDonations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUnits: 0,
    totalCount: 0,
    livesSaved: 0
  });

  const maskName = (fullName) => {
    if (!fullName) return 'Patient';
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
  };

  const fetchDonations = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const isDemo = user.id.startsWith('demo-');
      if (isDemo) {
        const localDonations = localStorage.getItem('jeevansetu_demo_donations') || '[]';
        const parsed = JSON.parse(localDonations);
        setDonations(parsed);

        const totalUnits = parsed.reduce((sum, item) => sum + (parseFloat(item.units_donated) || 0), 0);
        const totalCount = parsed.length;
        setStats({
          totalUnits,
          totalCount,
          livesSaved: totalCount * 3
        });
      } else {
        // Query database
        const { data, error } = await supabase
          .from('donations')
          .select(`
            id,
            donation_date,
            blood_group,
            units_donated,
            hospital_name,
            status,
            profiles!patient_id (
              full_name
            )
          `)
          .eq('donor_id', user.id)
          .order('donation_date', { ascending: false });

        if (error) throw error;
        setDonations(data || []);

        // Calculate stats
        const totalUnits = (data || []).reduce((sum, item) => sum + (parseFloat(item.units_donated) || 0), 0);
        const totalCount = (data || []).length;
        setStats({
          totalUnits,
          totalCount,
          livesSaved: totalCount * 3
        });
      }
    } catch (err) {
      console.error('Error fetching donations:', err);
      toast.error('Failed to load donation history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDonations();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDonations]);

  const columns = [
    {
      header: 'Date',
      render: (row) => <span>{new Date(row.donation_date).toLocaleDateString('en-GB')}</span>
    },
    {
      header: 'Blood Group',
      render: (row) => <BloodGroupBadge bloodGroup={row.blood_group} />
    },
    {
      header: 'Units',
      render: (row) => <span className="font-bold text-text-primary">{row.units_donated} Unit(s)</span>
    },
    {
      header: 'Hospital',
      accessor: 'hospital_name'
    },
    {
      header: 'Patient Recipient',
      render: (row) => <span>{maskName(row.profiles?.full_name)}</span>
    },
    {
      header: 'Status',
      render: () => (
        <span className="flex items-center gap-1.5 text-success font-semibold text-xs">
          <CheckCircle size={14} />
          Completed
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="My Donation History" 
        subtitle="View all your past blood and stem cell donations and track your cumulative community impact." 
      />

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Units Donated" 
          value={`${stats.totalUnits} Units`} 
          icon={<Heart size={20} className="text-brand-primary" />} 
        />
        <StatCard 
          title="Total Donations" 
          value={stats.totalCount} 
          icon={<Calendar size={20} className="text-info" />} 
        />
        <StatCard 
          title="Lives Saved / Impacted" 
          value={stats.livesSaved} 
          icon={<Award size={20} className="text-purple-accent" />} 
          trend="Each donation saves up to 3 lives"
        />
      </div>

      <div className="bg-bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Log of Completed Donations
        </h3>
        <DataTable 
          columns={columns} 
          data={donations} 
          emptyMessage="You have not completed any donations yet. Go to the Requests Feed to view matching urgent requests!" 
        />
      </div>
    </div>
  );
}

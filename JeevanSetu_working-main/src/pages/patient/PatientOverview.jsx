import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import BloodGroupBadge from '../../components/ui/BloodGroupBadge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  FileText, 
  CheckCircle, 
  Calendar, 
  Users, 
  Plus, 
  Clock,
  Heart,
  Droplet
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PatientOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    fulfilledRequests: 0,
    nextTransfusionDue: 'N/A',
    donorMatches: 0
  });
  const [activeRequest, setActiveRequest] = useState(null);
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  // Calculate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    if (!user) return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Query real Supabase DB
        // Fetch requests stats
        const { data: requests, error: reqError } = await supabase
          .from('blood_requests')
          .select('status, id, urgency_level, blood_group_needed, units_required, hospital_name, hospital_city, required_by_date')
          .eq('patient_id', user.id);

        if (reqError) throw reqError;

        const total = requests?.length || 0;
        const fulfilled = requests?.filter(r => r.status === 'Fulfilled').length || 0;
        const openReq = requests?.find(r => r.status === 'Open' || r.status === 'Donor Found');

        let notified = 0;
        if (openReq) {
          const { count, error: notifyError } = await supabase
            .from('donor_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', openReq.id);
          if (!notifyError) notified = count || 0;
          setActiveRequest(openReq);
          setNotifiedCount(notified);
        } else {
          setActiveRequest(null);
          setNotifiedCount(0);
        }

        // Fetch donor matches
        const userBlood = user.user_metadata?.blood_group;
        const userState = user.user_metadata?.state || '';
        let matchesCount = 0;

        if (userBlood) {
          // Find compatible blood groups
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
          const compatibleGroups = compatibilityMap[userBlood] || [userBlood];

          let matchQuery = supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'donor')
            .eq('is_active', true)
            .in('blood_group', compatibleGroups);

          if (userState) {
            const cleanState = userState.replace(/\s+/g, '');
            matchQuery = matchQuery.ilike('state', `%${cleanState}%`);
          }

          const { count, error: matchError } = await matchQuery;
          if (!matchError) {
            matchesCount = count || 0;
          }
        }

        // Fetch transfusion history
        const { data: transfusions, error: transError } = await supabase
          .from('transfusion_history')
          .select('*')
          .eq('patient_id', user.id)
          .order('transfusion_date', { ascending: false });

        if (transError) throw transError;

        // Next transfusion due estimation (default 21 days from last transfusion date)
        let nextDue = 'N/A';
        if (transfusions && transfusions.length > 0) {
          const lastDate = new Date(transfusions[0].transfusion_date);
          const dueDate = new Date(lastDate.getTime() + 21 * 24 * 60 * 60 * 1000);
          
          // Format DD/MM/YYYY
          const day = String(dueDate.getDate()).padStart(2, '0');
          const month = String(dueDate.getMonth() + 1).padStart(2, '0');
          const year = dueDate.getFullYear();
          
          const diffDays = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          nextDue = `${day}/${month}/${year} (${diffDays > 0 ? `In ${diffDays} days` : 'Overdue'})`;
        }

        setStats({
          totalRequests: total,
          fulfilledRequests: fulfilled,
          nextTransfusionDue: nextDue,
          donorMatches: matchesCount
        });

        // Compile recent activities
        const activities = [];
        if (transfusions) {
          transfusions.slice(0, 3).forEach(t => {
            const d = new Date(t.transfusion_date);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            activities.push({
              id: t.id,
              type: 'transfusion',
              date: formattedDate,
              title: 'Transfusion Logged',
              description: `Received ${t.units_received} units (${t.blood_group_received}) at ${t.hospital_name || 'Hospital'}`
            });
          });
        }

        if (requests) {
          requests.slice(0, 3).forEach(r => {
            const d = new Date(r.required_by_date);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            activities.push({
              id: r.id,
              type: 'request',
              date: formattedDate,
              title: `Request Created (Status: ${r.status})`,
              description: `Need ${r.units_required} units of ${r.blood_group_needed} by ${formattedDate}`
            });
          });
        }

        // Sort descending
        activities.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-');
          const dateB = b.date.split('/').reverse().join('-');
          return new Date(dateB) - new Date(dateA);
        });

        setRecentActivity(activities.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard details:', err);
        toast.error('Failed to load real-time stats.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Set up realtime subscriptions
    const channel = supabase
      .channel('patient_dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests', filter: `patient_id=eq.${user.id}` }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const userFullName = user?.user_metadata?.full_name || 'Patient';
  const bloodGroup = user?.user_metadata?.blood_group || 'AB+';
  const thalassemiaType = user?.user_metadata?.thalassemia_type || 'Major';

  return (
    <div className="space-y-8 animate-fadeIn relative">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-5%] left-[-10%] w-[350px] h-[350px] rounded-full bg-purple-accent/5 blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] right-[-10%] w-[300px] h-[300px] rounded-full bg-brand-primary/5 blur-[100px] pointer-events-none z-0" />

      {/* Welcome Greeting Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-border-subtle pb-6 bg-gradient-to-r from-bg-secondary/40 to-transparent p-6 rounded-2xl border border-border-subtle backdrop-blur-sm">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-text-primary via-text-primary to-purple-accent bg-clip-text text-transparent">
            {getGreeting()}, {userFullName} 👋
          </h1>
          <p className="text-xs text-text-secondary mt-2 max-w-xl leading-relaxed">
            Welcome to your dashboard. Track your thalassemia transfusion history, coordinate active requests, and view real-time matched donor networks nearby.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <BloodGroupBadge bloodGroup={bloodGroup} />
          <Badge variant="patient" className="shadow-lg shadow-purple-accent/10 border border-purple-accent/20">
            Thalassemia {thalassemiaType}
          </Badge>
        </div>
      </div>

      {/* 4 Premium Stat Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Total Requests" 
            value={stats.totalRequests} 
            icon={<FileText size={20} className="text-purple-accent" />}
            trend="Lifetime requests raised"
            className="border-purple-accent/10 group-hover:border-purple-accent/30 transition-colors shadow-lg shadow-purple-accent/2"
          />
        </div>
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Requests Fulfilled" 
            value={stats.fulfilledRequests} 
            icon={<CheckCircle size={20} className="text-brand-primary" />}
            trend={`${stats.totalRequests ? Math.round((stats.fulfilledRequests / stats.totalRequests) * 100) : 0}% fulfillment rate`}
            className="border-brand-primary/10 group-hover:border-brand-primary/30 transition-colors shadow-lg shadow-brand-primary/2"
          />
        </div>
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Next Transfusion" 
            value={stats.nextTransfusionDue} 
            icon={<Calendar size={20} className="text-info" />}
            trend="Based on 21-day cycle"
            className="border-info/10 group-hover:border-info/30 transition-colors shadow-lg shadow-info/2"
          />
        </div>
        <div className="group transition-all duration-300 hover:scale-[1.02]">
          <StatCard 
            title="Matches Available" 
            value={stats.donorMatches} 
            icon={<Users size={20} className="text-warning" />}
            trend="Compatible donors in state"
            className="border-warning/10 group-hover:border-warning/30 transition-colors shadow-lg shadow-warning/2"
          />
        </div>
      </div>

      {/* Main Grid: Active Request Banner & Activity Feed */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Request Card */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-accent animate-ping" />
            Active Blood Request
          </h2>
          
          {activeRequest ? (
            <div className="bg-gradient-to-br from-bg-card to-bg-secondary border border-border-main p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden group hover:border-purple-accent/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-accent/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-purple-accent/10" />
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-mono text-text-muted bg-bg-elevated px-2 py-0.5 rounded border border-border-subtle">
                      ID: #{activeRequest.id.substring(0, 8)}
                    </span>
                    <span className="text-[10px] bg-warning/10 text-warning px-2.5 py-0.5 rounded-full font-bold tracking-wider uppercase border border-warning/20">
                      {activeRequest.status}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-text-primary mt-1">
                    {activeRequest.units_required} Units of {activeRequest.blood_group_needed} Needed
                  </h3>
                  <p className="text-sm text-text-secondary">
                    Required at <span className="font-semibold text-text-primary">{activeRequest.hospital_name}</span> ({activeRequest.hospital_city})
                  </p>
                </div>
                
                <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error shadow-lg shadow-error/10 group-hover:scale-110 transition-transform">
                  <Droplet size={28} fill="currentColor" className="animate-pulse" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 py-4 border-t border-b border-border-subtle text-xs relative z-10">
                <div className="bg-bg-elevated/20 p-3 rounded-lg border border-border-subtle/50">
                  <p className="text-text-muted font-medium uppercase tracking-wider text-[10px]">Required By</p>
                  <p className="font-bold text-text-primary text-sm mt-1">
                    {new Date(activeRequest.required_by_date).toLocaleDateString('en-GB')}
                  </p>
                </div>
                <div className="bg-bg-elevated/20 p-3 rounded-lg border border-border-subtle/50">
                  <p className="text-text-muted font-medium uppercase tracking-wider text-[10px]">Donors Notified</p>
                  <p className="font-bold text-warning text-sm mt-1 flex items-center gap-1.5">
                    <Users size={16} />
                    {notifiedCount} matches alerted
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2 relative z-10">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/patient/dashboard/requests')}
                  className="hover:bg-bg-elevated transition-colors"
                >
                  Manage Requests
                </Button>
                <Button 
                  variant="patient"
                  onClick={() => navigate('/patient/dashboard/donors')}
                  className="shadow-lg shadow-purple-accent/10 hover:shadow-purple-accent/20 transition-all"
                >
                  Find Compatible Donors
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-bg-card border border-border-main p-10 rounded-2xl text-center flex flex-col items-center justify-center gap-5 hover:border-border-main/80 transition-colors shadow-xl">
              <div className="p-5 bg-bg-secondary border border-border-subtle rounded-2xl text-text-muted group hover:text-purple-accent hover:border-purple-accent/30 hover:scale-105 transition-all">
                <Plus size={36} />
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-text-primary">No Active Request</h3>
                <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                  Need a blood transfusion? Create a blood request immediately to notify and match with compatible donors in your local region.
                </p>
              </div>
              <Button 
                variant="patient" 
                onClick={() => navigate('/patient/dashboard/requests')}
                className="mt-2 shadow-lg shadow-purple-accent/10"
              >
                Create Blood Request
              </Button>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-text-secondary uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} className="text-text-muted" />
            Recent Health Activity
          </h2>
          <div className="bg-bg-card border border-border-main rounded-2xl p-6 shadow-xl space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-10 text-xs text-text-muted leading-relaxed">
                No recent health or request logs found.
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, idx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {idx !== recentActivity.length - 1 && (
                          <span 
                            className="absolute top-4 left-4 -ml-px h-full w-[1px] bg-border-subtle" 
                            aria-hidden="true" 
                          />
                        )}
                        <div className="relative flex space-x-3.5 group">
                          <div>
                            <span className={`h-8 w-8 rounded-xl flex items-center justify-center ring-8 ring-bg-card transition-all group-hover:scale-105 ${
                              activity.type === 'transfusion' 
                                ? 'bg-brand-muted text-brand-primary border border-brand-primary/20' 
                                : activity.type === 'request'
                                ? 'bg-purple-muted text-purple-accent border border-purple-accent/20'
                                : 'bg-bg-elevated text-text-secondary'
                            }`}>
                              {activity.type === 'transfusion' ? (
                                <Heart size={14} fill="currentColor" />
                              ) : activity.type === 'request' ? (
                                <FileText size={14} />
                              ) : (
                                <Clock size={14} />
                              )}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-xs font-bold text-text-primary group-hover:text-purple-hover transition-colors">
                              {activity.title}
                            </p>
                            <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                              {activity.description}
                            </p>
                            <span className="text-[9px] font-mono text-text-muted mt-2.5 block">
                              {activity.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

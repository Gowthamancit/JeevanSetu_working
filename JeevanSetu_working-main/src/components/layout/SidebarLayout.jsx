import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  History, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Heart, 
  Award, 
  Calendar,
  Activity
} from 'lucide-react';

export default function SidebarLayout() {
  const { role, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const isPatientPath = location.pathname.startsWith('/patient');
  
  // Define navigation items based on user dashboard type
  const patientNav = [
    { name: 'Overview', path: '/patient/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Blood Requests', path: '/patient/dashboard/requests', icon: <FileText size={18} /> },
    { name: 'Find Donors', path: '/patient/dashboard/donors', icon: <Search size={18} /> },
    { name: 'Transfusion Log', path: '/patient/dashboard/history', icon: <History size={18} /> },
    { name: 'My Profile', path: '/patient/dashboard/profile', icon: <User size={18} /> },
  ];

  const donorNav = [
    { name: 'Overview', path: '/donor/dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Requests Feed', path: '/donor/dashboard/requests', icon: <Activity size={18} /> },
    { name: 'My Donations', path: '/donor/dashboard/donations', icon: <Heart size={18} /> },
    { name: 'Availability', path: '/donor/dashboard/availability', icon: <Calendar size={18} /> },
    { name: 'My Impact', path: '/donor/dashboard/impact', icon: <Award size={18} /> },
    { name: 'My Profile', path: '/donor/dashboard/profile', icon: <User size={18} /> },
  ];

  const navigation = isPatientPath ? patientNav : donorNav;

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    if (!user || role !== 'donor') return;

    const fetchPendingCount = async () => {
      try {
        const { count, error } = await supabase
          .from('donor_notifications')
          .select('*', { count: 'exact', head: true })
          .eq('donor_id', user.id)
          .eq('status', 'Pending');
        
        if (error) throw error;
        setPendingCount(count || 0);
      } catch (err) {
        console.error('Error fetching pending notifications count:', err);
      }
    };

    fetchPendingCount();

    // Subscribe to changes in donor_notifications
    const channel = supabase
      .channel('sidebar_pending_notifications')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'donor_notifications', 
          filter: `donor_id=eq.${user.id}` 
        },
        () => {
          fetchPendingCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, role]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col md:flex-row">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-60 border-r border-border-subtle bg-bg-secondary shrink-0 justify-between h-screen sticky top-0">
        <div className="flex flex-col">
          {/* Sidebar Logo */}
          <div className="h-14 border-b border-border-subtle flex items-center px-6 gap-2">
            <div className={`w-6 h-6 rounded bg-${isPatientPath ? 'purple-accent' : 'brand-primary'} flex items-center justify-center font-bold text-xs text-bg-primary`}>
              J
            </div>
            <span className="font-bold text-base tracking-tight">
              Jeevan<span className={isPatientPath ? 'text-purple-accent' : 'text-brand-primary'}>Setu</span>
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith('/dashboard')}
                className={({ isActive }) => 
                  `flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive 
                      ? isPatientPath 
                        ? 'bg-purple-muted/30 text-purple-accent border-l-2 border-purple-accent' 
                        : 'bg-brand-muted/30 text-brand-primary border-l-2 border-brand-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.name === 'Requests Feed' && pendingCount > 0 && (
                  <span className="bg-warning text-bg-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="p-4 border-t border-border-subtle flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-secondary border border-border-main">
              {user?.user_metadata?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-primary truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-[10px] text-text-muted truncate capitalize">
                {role || 'Role'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md text-error hover:bg-error/10 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Header (hidden on desktop) */}
      <header className="md:hidden h-14 border-b border-border-subtle bg-bg-secondary flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded bg-${isPatientPath ? 'purple-accent' : 'brand-primary'} flex items-center justify-center font-bold text-xs text-bg-primary`}>
            J
          </div>
          <span className="font-bold text-sm tracking-tight">
            Jeevan<span className={isPatientPath ? 'text-purple-accent' : 'text-brand-primary'}>Setu</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-text-secondary hover:text-text-primary focus:outline-none"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer (visible when open) */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-bg-primary/95 z-30 pt-16 px-6 flex flex-col justify-between pb-8">
          <nav className="flex flex-col gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path.endsWith('/dashboard')}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center justify-between px-4 py-3 text-base font-semibold rounded-md transition-colors ${
                    isActive 
                      ? isPatientPath 
                        ? 'bg-purple-muted/40 text-purple-accent border-l-4 border-purple-accent' 
                        : 'bg-brand-muted/40 text-brand-primary border-l-4 border-brand-primary'
                      : 'text-text-secondary hover:bg-bg-elevated'
                  }`
                }
              >
                <div className="flex items-center gap-4">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.name === 'Requests Feed' && pendingCount > 0 && (
                  <span className="bg-warning text-bg-primary text-xs font-bold px-2 py-0.5 rounded-full min-w-5 text-center">
                    {pendingCount}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-4 px-4 py-3 text-base font-semibold rounded-md text-error hover:bg-error/10 transition-colors w-full"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex h-14 border-b border-border-subtle bg-bg-secondary items-center justify-end px-8 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-xs font-bold text-text-secondary border border-border-main">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium text-text-primary">
                {user?.user_metadata?.full_name || 'User'}
              </span>
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-semibold ${isPatientPath ? 'bg-purple-muted text-purple-accent' : 'bg-brand-muted text-brand-primary'}`}>
                {role || (isPatientPath ? 'patient' : 'donor')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-text-secondary hover:text-error transition-colors p-1"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Navigation (max 5 items, active on screens < md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 bg-bg-secondary border-t border-border-subtle flex items-center justify-around z-20 px-2">
        {navigation.slice(0, 5).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path.endsWith('/dashboard')}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors py-1 px-3 relative ${
                isActive 
                  ? isPatientPath 
                    ? 'text-purple-accent' 
                    : 'text-brand-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`
            }
          >
            {item.icon}
            <span className="truncate max-w-[64px]">{item.name}</span>
            {item.name === 'Requests Feed' && pendingCount > 0 && (
              <span className="absolute top-1 right-2 bg-warning text-bg-primary text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

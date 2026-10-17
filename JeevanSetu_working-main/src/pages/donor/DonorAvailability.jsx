import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  Save, 
  MapPin, 
  X, 
  AlertTriangle,
  Plus
} from 'lucide-react';

export default function DonorAvailability() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // State variables for form
  const [isAvailable, setIsAvailable] = useState(true);
  const [willingToTravel, setWillingToTravel] = useState(false);
  const [maxTravelDistance, setMaxTravelDistance] = useState(25);
  const [preferredCities, setPreferredCities] = useState([]);
  const [cityInput, setCityInput] = useState('');
  const [isDeferred, setIsDeferred] = useState(false);
  const [deferralUntil, setDeferralUntil] = useState('');

  const fetchAvailabilitySettings = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('donor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setIsAvailable(data.is_available ?? true);
        setWillingToTravel(data.willing_to_travel ?? false);
        setMaxTravelDistance(data.max_travel_distance_km ?? 25);
        setPreferredCities(data.preferred_cities || []);
        setIsDeferred(data.is_deferred ?? false);
        setDeferralUntil(data.deferral_until || '');
      }
    } catch (err) {
      console.error('Error fetching availability details:', err);
      toast.error('Failed to load availability settings.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAvailabilitySettings();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAvailabilitySettings]);

  const handleAddCity = (e) => {
    e.preventDefault();
    const clean = cityInput.trim();
    if (!clean) return;
    if (preferredCities.some(c => c.toLowerCase() === clean.toLowerCase())) {
      toast.error('City already added!');
      return;
    }
    setPreferredCities([...preferredCities, clean]);
    setCityInput('');
  };

  const handleRemoveCity = (cityToRemove) => {
    setPreferredCities(preferredCities.filter(c => c !== cityToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        is_available: isAvailable,
        willing_to_travel: willingToTravel,
        max_travel_distance_km: willingToTravel ? parseInt(maxTravelDistance) : null,
        preferred_cities: preferredCities,
        is_deferred: isDeferred,
        deferral_until: isDeferred && deferralUntil ? deferralUntil : null
      };

      const { error } = await supabase
        .from('donor_profiles')
        .update(payload)
        .eq('id', user.id);

      if (error) throw error;
      toast.success('Availability settings saved!');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

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
        title="Availability Settings" 
        subtitle="Configure your donation willingness, geographic preferences, travel range, and medical deferrals." 
        action={
          <Button 
            variant="primary" 
            className="flex items-center gap-2"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Card: Availability and Travel */}
        <div className="bg-bg-card border border-border p-6 rounded-lg shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-subtle pb-3">
            Donation Status
          </h3>

          {/* Master Toggle */}
          <div className="flex items-center justify-between p-4 bg-bg-secondary rounded border border-border-subtle">
            <div>
              <h4 className="text-xs font-bold text-text-primary">
                Available to Donate
              </h4>
              <p className="text-[10px] text-text-secondary mt-0.5">
                Toggle offline to temporarily hide your profile from search queries.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-bg-primary after:border-border-subtle after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
            </label>
          </div>

          {/* Willing to Travel Toggle */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">
                  Willing to Travel
                </h4>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Are you open to traveling to nearby hospitals/cities to donate?
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={willingToTravel}
                  onChange={(e) => setWillingToTravel(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-bg-primary after:border-border-subtle after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            {willingToTravel && (
              <div className="bg-bg-secondary p-4 rounded border border-border-subtle space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">
                  Maximum Travel Distance
                </label>
                <select
                  value={maxTravelDistance}
                  onChange={(e) => setMaxTravelDistance(e.target.value)}
                  className="w-full bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                >
                  <option value={25}>25 km (Local vicinity)</option>
                  <option value={50}>50 km (Regional)</option>
                  <option value={100}>100 km (Intercity travel)</option>
                  <option value={9999}>Anywhere (Unrestricted)</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Right Card: Preferred Cities & Deferral */}
        <div className="bg-bg-card border border-border p-6 rounded-lg shadow-sm space-y-6">
          <h3 className="text-sm font-semibold text-text-primary border-b border-border-subtle pb-3">
            Preferred Cities & Deferrals
          </h3>

          {/* Preferred Cities tag input */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-secondary">
              Preferred Donation Cities
            </label>
            <form onSubmit={handleAddCity} className="flex gap-2">
              <input 
                type="text"
                placeholder="Type city and press Enter..."
                value={cityInput}
                onChange={(e) => setCityInput(e.target.value)}
                className="flex-1 bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
              />
              <Button type="submit" variant="secondary" size="sm" className="px-3">
                <Plus size={16} />
              </Button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {preferredCities.length === 0 ? (
                <span className="text-[10px] text-text-muted italic">No preferred cities selected (Defaulting to home city)</span>
              ) : (
                preferredCities.map((city) => (
                  <span 
                    key={city}
                    className="inline-flex items-center gap-1 bg-bg-secondary text-text-primary border border-border text-[10px] font-semibold py-1 px-2 rounded-full"
                  >
                    <MapPin size={10} className="text-brand-primary" />
                    {city}
                    <button 
                      type="button"
                      onClick={() => handleRemoveCity(city)}
                      className="text-text-muted hover:text-error focus:outline-none"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Medical Deferral */}
          <div className="space-y-4 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">
                  Medical Deferral
                </h4>
                <p className="text-[10px] text-text-secondary mt-0.5">
                  Are you currently deferred from donating by a doctor?
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isDeferred}
                  onChange={(e) => setIsDeferred(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-bg-elevated peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-bg-primary after:border-border-subtle after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
              </label>
            </div>

            {isDeferred && (
              <div className="bg-error/5 p-4 rounded border border-error/20 space-y-3">
                <div className="flex items-start gap-2 text-[10px] text-error">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <p>Setting a deferral locks your eligibility completely until the selected date.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Deferral Until Date
                  </label>
                  <input 
                    type="date"
                    value={deferralUntil}
                    onChange={(e) => setDeferralUntil(e.target.value)}
                    className="w-full bg-bg-input border border-border rounded p-2 text-sm text-text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

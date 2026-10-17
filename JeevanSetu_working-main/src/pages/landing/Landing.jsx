import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Activity, 
  ArrowRight, 
  Shield, 
  Users, 
  CheckCircle2, 
  Award, 
  HelpCircle, 
  Sparkles,
  Droplet,
  ChevronDown
} from 'lucide-react';

const bloodCompatibility = {
  'O-': { canDonateTo: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], canReceiveFrom: ['O-'] },
  'O+': { canDonateTo: ['A+','B+','AB+','O+'], canReceiveFrom: ['O-','O+'] },
  'A-': { canDonateTo: ['A+','A-','AB+','AB-'], canReceiveFrom: ['O-','A-'] },
  'A+': { canDonateTo: ['A+','AB+'], canReceiveFrom: ['O-','O+','A-','A+'] },
  'B-': { canDonateTo: ['B+','B-','AB+','AB-'], canReceiveFrom: ['O-','B-'] },
  'B+': { canDonateTo: ['B+','AB+'], canReceiveFrom: ['O-','O+','B-','B+'] },
  'AB-': { canDonateTo: ['AB+','AB-'], canReceiveFrom: ['O-','A-','B-','AB-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['O-','O+','A-','A+','B-','B+','AB-','AB+'] }
};

const bloodGroupColors = {
  'A+':  'bg-red-500/10 text-[#ef4444] border-[#ef4444]/30',
  'A-':  'bg-red-400/10 text-[#f87171] border-[#f87171]/30',
  'B+':  'bg-blue-500/10 text-[#3b82f6] border-[#3b82f6]/30',
  'B-':  'bg-blue-400/10 text-[#60a5fa] border-[#60a5fa]/30',
  'O+':  'bg-emerald-500/10 text-[#10b981] border-[#10b981]/30',
  'O-':  'bg-emerald-400/10 text-[#34d399] border-[#34d399]/30',
  'AB+': 'bg-violet-500/10 text-[#8b5cf6] border-[#8b5cf6]/30',
  'AB-': 'bg-violet-400/10 text-[#a78bfa] border-[#a78bfa]/30',
};

export default function Landing() {
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('O-');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "What is Thalassemia and why is blood donation critical for it?",
      a: "Thalassemia is an inherited blood disorder characterized by less oxygen-carrying protein (hemoglobin) and fewer red blood cells than normal. Patients with Thalassemia Major require regular blood transfusions every 2-4 weeks to sustain life. Timely access to compatible blood is critical to prevent severe anemia and organ failure."
    },
    {
      q: "How does JeevanSetu connect patients and donors?",
      a: "JeevanSetu uses automated matching criteria based on blood compatibility rules and geographic proximity. When a patient submits a request, compatible donors registered in the same region receive instant real-time invitations. Once a donor accepts, contact details are unlocked securely."
    },
    {
      q: "Is patient and donor privacy protected?",
      a: "Yes. To protect user privacy, patient and donor profiles display only the first name and last initial (e.g., 'Aravind K.'). Contact numbers are strictly hidden and are only revealed to a donor after they officially click 'Accept' on an invitation."
    },
    {
      q: "What is the 90-day eligibility cycle for donors?",
      a: "For donor health and safety, medical guidelines require a minimum gap of 90 days between blood donations. JeevanSetu tracks this automatically; when a donor logs a completed donation, the system marks them deferred and displays their next eligible date."
    }
  ];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col font-sans select-none overflow-x-hidden relative">
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-accent/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-brand-primary/5 blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-purple-accent/5 blur-[120px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="h-14 border-b border-border-subtle bg-bg-primary/80 backdrop-blur sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 transition-all">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-accent flex items-center justify-center font-bold text-lg text-text-primary shadow-lg shadow-purple-accent/30 relative overflow-hidden group">
            <span className="relative z-10 transition-transform group-hover:scale-110">J</span>
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-hover to-purple-accent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-bold text-xl tracking-tight text-text-primary">
            Jeevan<span className="text-purple-accent">Setu</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/patient/login"
            className="text-sm font-medium text-text-secondary hover:text-purple-accent transition-all duration-200"
          >
            I Need Blood
          </Link>
          <Link
            to="/donor/login"
            className="px-4 py-1.5 text-xs font-semibold rounded-md bg-brand-primary text-bg-primary hover:bg-brand-hover transition-all duration-200 shadow-md shadow-brand-primary/10 hover:shadow-brand-primary/20 hover:scale-[1.02]"
          >
            I Want to Donate
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center max-w-5xl mx-auto">
        {/* Hackathon Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-muted bg-purple-muted/20 text-purple-accent text-xs font-semibold mb-8 animate-pulse shadow-sm">
          <Sparkles size={12} className="text-brand-primary" />
          Built by Team SimplyWaste
        </div>

        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-4 max-w-4xl leading-none bg-gradient-to-r from-purple-accent via-[#a78bfa] to-brand-primary bg-clip-text text-transparent filter drop-shadow-[0_2px_10px_rgba(124,58,237,0.15)]">
          JeevanSetu
        </h1>
        <h2 className="text-xl md:text-3xl font-bold tracking-tight mb-6 text-text-primary max-w-2xl leading-relaxed">
          Bridging lives through timely blood access
        </h2>
        <p className="text-text-secondary text-sm md:text-base max-w-2xl mb-12 leading-relaxed">
          An AI-powered Thalassemia care and real-time donor management platform. 
          Connecting patients with critical transfusion requirements directly to verified, eligible local donors instantly.
        </p>

        {/* Action Hooks Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4 mb-20">
          {/* Card 1: Patient */}
          <div className="bg-purple-muted/5 border border-purple-muted/20 hover:border-purple-accent/60 rounded-2xl p-8 text-left transition-all duration-300 shadow-xl flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-accent/5 rounded-bl-full pointer-events-none group-hover:bg-purple-accent/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-muted/30 border border-purple-accent/20 flex items-center justify-center text-purple-accent mb-6 group-hover:scale-110 transition-transform">
                <Activity size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-text-primary">I Need Blood</h3>
              <p className="text-text-secondary text-xs md:text-sm mb-8 leading-relaxed">
                Register as a Thalassemia patient or family member to raise urgent transfusion requests, matching instantly with nearby compatible donors.
              </p>
            </div>
            <Link
              to="/patient/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-purple-accent group-hover:text-purple-hover transition-colors"
            >
              Access Patient Portal 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 2: Donor */}
          <div className="bg-brand-muted/5 border border-brand-muted/20 hover:border-brand-primary/60 rounded-2xl p-8 text-left transition-all duration-300 shadow-xl flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-primary/5 rounded-bl-full pointer-events-none group-hover:bg-brand-primary/10 transition-colors" />
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-muted/30 border border-brand-primary/20 flex items-center justify-center text-brand-primary mb-6 group-hover:scale-110 transition-transform">
                <Heart size={24} />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-text-primary">I Want to Donate</h3>
              <p className="text-text-secondary text-xs md:text-sm mb-8 leading-relaxed">
                Register as a donor to receive nearby matching requests, configure travel ranges, log completed donations, and track your saving impact.
              </p>
            </div>
            <Link
              to="/donor/login"
              className="inline-flex items-center gap-2 text-sm font-bold text-brand-primary group-hover:text-brand-hover transition-colors"
            >
              Access Donor Portal 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="w-full border border-border-subtle py-8 bg-bg-secondary/40 backdrop-blur-sm rounded-xl grid grid-cols-2 md:grid-cols-4 gap-6 px-4">
          <div className="space-y-1">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Lives Saved</p>
            <p className="text-3xl font-extrabold text-brand-primary">12,450+</p>
          </div>
          <div className="space-y-1 border-l border-border-subtle/50 md:border-l pl-4">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Active Donors</p>
            <p className="text-3xl font-extrabold text-purple-accent">4,200+</p>
          </div>
          <div className="space-y-1 border-l border-border-subtle/50 pl-4">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Avg Match Time</p>
            <p className="text-3xl font-extrabold text-info">15 Mins</p>
          </div>
          <div className="space-y-1 border-l border-border-subtle/50 pl-4">
            <p className="text-text-secondary text-xs font-semibold uppercase tracking-wider">Fulfillment Rate</p>
            <p className="text-3xl font-extrabold text-warning">98.4%</p>
          </div>
        </div>
      </section>

      {/* Interactive Blood Compatibility Checker */}
      <section className="relative z-10 py-20 px-6 border-t border-border-subtle bg-bg-secondary/20">
        <div className="max-w-4xl mx-auto bg-bg-card border border-border-main rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-accent/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6">
            <Droplet size={28} className="text-red-500 fill-red-500/20" />
            <h3 className="text-xl md:text-2xl font-bold text-text-primary">Interactive Blood Compatibility Guide</h3>
          </div>
          <p className="text-text-secondary text-sm mb-8 leading-relaxed max-w-2xl">
            Quickly understand donor matches based on patient requirements. Select a blood type to see whom it can receive from and donate to:
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left: Blood Group Selection Grid */}
            <div className="space-y-3">
              <span className="block text-xs font-semibold text-text-secondary uppercase tracking-wider">Select Blood Group</span>
              <div className="grid grid-cols-4 gap-2">
                {Object.keys(bloodCompatibility).map((group) => (
                  <button
                    key={group}
                    onClick={() => setSelectedBloodGroup(group)}
                    className={`h-11 rounded-lg border text-sm font-bold transition-all ${
                      selectedBloodGroup === group
                        ? 'bg-purple-accent border-purple-accent text-text-primary shadow-lg shadow-purple-accent/20 scale-[1.05]'
                        : 'bg-bg-input border-border-main text-text-secondary hover:text-text-primary hover:border-text-secondary'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Results */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-bg-secondary/40 border border-border-subtle p-5 rounded-xl">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#3ecf8e] uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Can Donate To
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bloodCompatibility[selectedBloodGroup].canDonateTo.map((group) => (
                    <span
                      key={group}
                      className={`text-xs font-bold px-2.5 py-1 rounded border ${bloodGroupColors[group] || 'bg-bg-input border-border'}`}
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-xs font-semibold text-purple-accent uppercase tracking-wider flex items-center gap-1.5">
                  <Award size={14} /> Can Receive From
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {bloodCompatibility[selectedBloodGroup].canReceiveFrom.map((group) => (
                    <span
                      key={group}
                      className={`text-xs font-bold px-2.5 py-1 rounded border ${bloodGroupColors[group] || 'bg-bg-input border-border'}`}
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative z-10 bg-bg-secondary border-t border-border-subtle py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">How It Works</h2>
          <p className="text-text-secondary text-sm md:text-base max-w-xl mx-auto mb-16 leading-relaxed">
            A simple, verified, and direct system connecting patients and donors.
          </p>

          <div className="grid md:grid-cols-2 gap-12 text-left">
            {/* Patient Flow */}
            <div className="bg-bg-card border border-border-main rounded-2xl p-8 shadow-lg hover:border-purple-accent/30 transition-all group">
              <h3 className="text-xl font-bold text-purple-accent mb-8 flex items-center gap-2 border-b border-border-subtle pb-4">
                <Activity size={20} />
                <span>For Patients & Families</span>
              </h3>
              <ol className="space-y-6 text-sm text-text-secondary relative">
                <li className="flex gap-4 items-start relative group-hover:translate-x-1 transition-transform">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-muted text-purple-accent font-bold text-xs shrink-0 mt-0.5 border border-purple-accent/30">1</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Create Profile</h4>
                    <p className="text-xs">Sign up, input your required blood group, clinical details, and treating hospital details.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start relative group-hover:translate-x-1 transition-transform delay-75">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-muted text-purple-accent font-bold text-xs shrink-0 mt-0.5 border border-purple-accent/30">2</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Raise Blood Request</h4>
                    <p className="text-xs">Specify blood units, urgency, and targeted hospital. Matching donors are notified instantly.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start relative group-hover:translate-x-1 transition-transform delay-150">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-muted text-purple-accent font-bold text-xs shrink-0 mt-0.5 border border-purple-accent/30">3</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Track Matches & Details</h4>
                    <p className="text-xs">Interact with compatible local donors, coordinate donations, and logs transfusion logs.</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Donor Flow */}
            <div className="bg-bg-card border border-border-main rounded-2xl p-8 shadow-lg hover:border-brand-primary/30 transition-all group">
              <h3 className="text-xl font-bold text-brand-primary mb-8 flex items-center gap-2 border-b border-border-subtle pb-4">
                <Heart size={20} />
                <span>For Blood Donors</span>
              </h3>
              <ol className="space-y-6 text-sm text-text-secondary relative">
                <li className="flex gap-4 items-start relative group-hover:translate-x-1 transition-transform">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-muted text-brand-primary font-bold text-xs shrink-0 mt-0.5 border border-brand-primary/30">1</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Set Availability</h4>
                    <p className="text-xs">Specify blood type, travel willingness (up to 100km), and toggle availability on/off.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start relative group-hover:translate-x-1 transition-transform delay-75">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-muted text-brand-primary font-bold text-xs shrink-0 mt-0.5 border border-brand-primary/30">2</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Respond to Invites</h4>
                    <p className="text-xs">Review local match requests. Decline, or Accept to unlock emergency contact and location details.</p>
                  </div>
                </li>
                <li className="flex gap-4 items-start relative group-hover:translate-x-1 transition-transform delay-150">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-muted text-brand-primary font-bold text-xs shrink-0 mt-0.5 border border-brand-primary/30">3</span>
                  <div>
                    <h4 className="font-bold text-text-primary text-sm mb-1">Log & See Impact</h4>
                    <p className="text-xs">Log completion, track next donation dates automatically, and visualize lives saved.</p>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive FAQ Section */}
      <section className="relative z-10 py-24 px-6 border-t border-border-subtle bg-bg-primary">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-text-secondary text-sm">Everything you need to know about Thalassemia care & blood donation.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div 
                  key={index} 
                  className="bg-bg-card border border-border-main rounded-xl overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm md:text-base text-text-primary hover:bg-bg-elevated/40 transition-colors focus:outline-none"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle size={18} className="text-purple-accent shrink-0" />
                      {faq.q}
                    </span>
                    <ChevronDown 
                      size={18} 
                      className={`text-text-secondary shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-purple-accent' : ''}`} 
                    />
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out overflow-hidden ${
                      isOpen ? 'max-h-60 border-t border-border-subtle p-5 bg-bg-secondary/40' : 'max-h-0'
                    }`}
                  >
                    <p className="text-xs md:text-sm text-text-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border-subtle py-12 text-center text-xs text-text-muted bg-bg-secondary/60 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left space-y-1">
            <span className="font-bold text-sm tracking-tight text-text-primary">
              Jeevan<span className="text-purple-accent">Setu</span>
            </span>
            <p>AI-Powered Thalassemia Care & Blood Matching Platform</p>
          </div>
          <div className="text-center md:text-right space-y-1">
            <p>Developed with ❤️ by team <span className="text-text-secondary font-semibold">SimplyWaste</span> • © {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

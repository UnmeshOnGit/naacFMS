import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  FileText, 
  Upload, 
  Users, 
  LogOut, 
  LayoutDashboard, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Menu,
  X,
  Search,
  Bell,
  ChevronRight,
  Database,
  ShieldCheck,
  History,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { api, cn } from './lib/api';
import { User, NAAC_CRITERIA } from './lib/constants';
import { exportToPDF, exportToExcel } from './lib/exportUtils';

// --- Components ---

const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  size = 'md', 
  loading = false,
  ...props 
}: any) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button 
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant as keyof typeof variants],
        sizes[size as keyof typeof sizes],
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <Clock className="w-4 h-4 mr-2 animate-spin" />
      ) : null}
      {children}
    </button>
  );
};

const Card = ({ children, className, title, description }: any) => (
  <div className={cn('bg-white border border-slate-200 shadow-sm rounded overflow-hidden', className)}>
    {title && (
      <div className="px-6 py-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 uppercase tracking-wide text-sm">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Input = ({ label, error, className, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</label>}
    <input 
      className={cn(
        'w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300 text-sm font-medium text-slate-700',
        error && 'border-red-500 focus:ring-red-500/10',
        className
      )}
      {...props}
    />
    {error && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{error}</p>}
  </div>
);

const Select = ({ label, error, options, className, ...props }: any) => (
  <div className="space-y-1.5">
    {label && <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</label>}
    <select 
      className={cn(
        'w-full px-4 py-2.5 bg-white border border-slate-200 rounded focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-slate-700 cursor-pointer',
        error && 'border-red-500 focus:ring-red-500/10',
        className
      )}
      {...props}
    >
      <option value="" disabled>Select option...</option>
      {options.map((opt: any) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
    {error && <p className="text-[10px] font-bold text-red-500 mt-1 uppercase tracking-wider">{error}</p>}
  </div>
);

// --- Auth Context Substitute (Simple state) ---

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (data: { user: User; token: string }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout, loading };
}

// --- Layout Components ---

const SidebarLink = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      'flex items-center gap-3 px-4 py-3 transition-colors group text-sm',
      active 
        ? 'bg-blue-600/10 text-blue-400 border-l-4 border-blue-500 font-medium' 
        : 'text-slate-400 hover:text-white hover:bg-slate-800'
    )}
  >
    <Icon className={cn('w-5 h-5', active ? 'text-blue-500' : 'text-slate-500 group-hover:text-white')} />
    <span>{label}</span>
  </Link>
);

const Layout = ({ children, user, logout }: any) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/criteria', label: 'All Criteria', icon: FileText },
    { to: '/files', label: 'File Manager', icon: Upload },
  ];

  if (user?.role === 'HOD') {
    menuItems.push(
      { to: '/teachers', label: 'Faculty Progress', icon: Users },
      { to: '/audit', label: 'Audit Logs', icon: History }
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col border-r border-slate-800 z-50">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8 text-white font-bold text-xl tracking-tight uppercase">
            <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center text-[10px]">NAAC</div>
            <span>Portal v2.4</span>
          </div>
          
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <SidebarLink 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))} 
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold italic">
              {user?.role === 'HOD' ? 'HOD' : 'FAC'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-500">{user?.department}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white transition-colors w-full uppercase tracking-widest"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <h1 className="text-xl font-semibold text-slate-800 tracking-tight">
              {location.pathname === '/' ? 'Dashboard' : 
               location.pathname.startsWith('/criteria') ? 'Criteria Matrix' :
               location.pathname.startsWith('/files') ? 'Evidence Repository' : 
               location.pathname.startsWith('/teachers') ? 'Faculty Management' : 'System Logs'}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Academic Year 2023-24 • Cycle 3 Assessment</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[10px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Institutional Portal Operational
            </div>
            <div className="h-4 w-[1px] bg-slate-200 mx-2" />
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-slate-400" />
               </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>

        {/* System Status Footer */}
        <footer className="h-10 border-t border-slate-200 bg-white flex items-center justify-between px-8 text-slate-400">
          <div className="flex items-center gap-6">
            <span className="text-[10px] flex items-center gap-1.5 uppercase font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Database: Operational
            </span>
            <span className="text-[10px] flex items-center gap-1.5 uppercase font-bold tracking-widest">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Storage: Connected
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold tracking-widest">
            Session: <span className="font-mono text-slate-600">SECURE_ENCRYPTED</span>
          </div>
        </footer>
      </main>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-64 bg-white h-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile menu content similar to sidebar */}
              <div className="flex items-center justify-between mb-8">
                 <ShieldCheck className="w-8 h-8" />
                 <button onClick={() => setIsMobileMenuOpen(false)}><X className="w-6 h-6" /></button>
              </div>
              <nav className="space-y-1">
                 {menuItems.map((item) => (
                   <SidebarLink 
                     key={item.to} 
                     {...item} 
                     active={location.pathname === item.to}
                     onClick={() => setIsMobileMenuOpen(false)}
                   />
                 ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Pages ---

const LoginPage = ({ login }: any) => {
  const [email, setEmail] = useState('teacher@university.edu');
  const [password, setPassword] = useState('password123');
  const [loginType, setLoginType] = useState<'TEACHER' | 'HOD'>('TEACHER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: any) => {
    e.preventDefault();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/login', { email, password });
      login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* Left side - Visual Branding */}
      <div className="hidden lg:flex w-5/12 bg-[#0f172a] p-16 flex-col justify-between relative overflow-hidden">
        {/* Background mesh/glow effects */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-600 rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-16"
          >
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-xl shadow-blue-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight uppercase">NAAC Portal</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl font-bold text-white leading-[1.1] mb-8 tracking-tight"
          >
            Digital <span className="text-blue-500 italic font-medium sr-only">Assurance</span> 
            Institutional <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Compliance</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-sm mb-12 text-lg font-light leading-relaxed font-sans"
          >
            Elevating academic standards through intelligent data orchestration and real-time assessment monitoring.
          </motion.p>

          <div className="space-y-6">
            {[
              { icon: CheckCircle2, text: 'SSR Documentation Automation' },
              { icon: FileText, text: 'Geometric Evidence Mapping' },
              { icon: BarChart3, text: 'Real-time Readiness Analytics' }
            ].map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + (index * 0.1) }}
                className="flex items-center gap-4 text-slate-300"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xs uppercase tracking-[0.2em] font-semibold">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 flex gap-12 border-t border-slate-800/50 pt-12"
        >
           <div className="flex flex-col gap-1">
              <span className="text-4xl font-bold text-white tracking-tighter">99.8%</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Accuracy Metric</span>
           </div>
           <div className="flex flex-col gap-1">
              <span className="text-4xl font-bold text-white tracking-tighter">12k+</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-bold">Data Points Indexed</span>
           </div>
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] bg-white p-8 lg:p-12 rounded-3xl shadow-2xl relative z-10 ring-1 ring-slate-200/50"
        >
          <div className="lg:hidden mb-12 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
            <span className="text-slate-900 font-bold text-xl tracking-tight uppercase">NAAC Portal</span>
          </div>
          
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">NAAC System Access</h2>
            </div>
            <p className="text-slate-500 text-sm font-medium">Enter your hierarchical credentials to access the institutional matrix.</p>
          </div>

          {/* Role selection tab style */}
          <div className="flex p-1.5 bg-slate-100 rounded-2xl mb-10 border border-slate-200">
            <button 
              type="button"
              onClick={() => {
                setLoginType('TEACHER');
                setEmail('teacher@university.edu');
                setPassword('password123');
              }}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                loginType === 'TEACHER' ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50 scale-[1.02]" : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              Faculty Login
            </button>
            <button 
              type="button"
              onClick={() => {
                setLoginType('HOD');
                setEmail('hod@university.edu');
                setPassword('password123');
              }}
              className={cn(
                "flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                loginType === 'HOD' ? "bg-white text-blue-600 shadow-md ring-1 ring-slate-200/50 scale-[1.02]" : "text-slate-500 hover:bg-slate-200/50"
              )}
            >
              Super HOD
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] ml-1">Authentication ID</label>
              <Input 
                placeholder={loginType === 'HOD' ? 'hod@university.edu' : 'faculty@university.edu'}
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
                required
                className="rounded-xl border-slate-200 text-base"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] ml-1">Secure Passkey</label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
                required
                className="rounded-xl border-slate-200 text-base"
              />
            </div>
            
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="p-4 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
            
            <Button 
              className="w-full py-4 text-xs uppercase tracking-[0.2em] font-bold shadow-xl shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-transform rounded-xl" 
              loading={loading} 
              type="submit"
            >
              Authenticate {loginType === 'HOD' ? 'HOD' : 'Faculty'}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
              Institutional portal v3.0.1
            </p>
            <Link to="/signup" className="text-[11px] uppercase tracking-widest font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors">
              Access Request <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const SignupPage = ({ login }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'TEACHER',
    department: 'Computer Science'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e: any) => {
    e.preventDefault();
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address (e.g., xyz@gmail.com)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await api.post('/auth/signup', formData);
      login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const departments = ['Computer Science', 'Information Technology', 'Mathematics', 'Electrical', 'Chemical', 'electronics', 'Management', 'English', 'Arts'];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <Card className="w-full max-w-xl p-0 border-slate-200 shadow-xl overflow-hidden" title="System Access Request" description="Create your institutional profile for assessment compliance.">
        <form onSubmit={handleSignup} className="p-8 lg:p-10 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Full Name" 
              placeholder="e.g. Sarah Mitchell"
              value={formData.name}
              onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input 
              label="Institutional Email" 
              placeholder="s.mitchell@university.edu"
              value={formData.email}
              onChange={(e: any) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              label="Designated Role" 
              options={[{ value: 'TEACHER', label: 'Faculty' }, { value: 'HOD', label: 'Dept. Head (HOD)' }]}
              value={formData.role}
              onChange={(e: any) => setFormData({ ...formData, role: e.target.value })}
            />
            <Select 
              label="Departmental Unit" 
              options={departments.map(d => ({ value: d, label: d }))}
              value={formData.department}
              onChange={(e: any) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <Input 
            label="Security Password" 
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e: any) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          {error && <div className="p-3 bg-red-50 text-red-500 rounded text-[10px] font-bold uppercase tracking-widest border border-red-100">{error}</div>}
          
          <div className="flex flex-col gap-4 pt-4">
            <Button className="w-full h-12 text-[10px] uppercase font-bold tracking-[0.2em] shadow-lg shadow-blue-500/10" loading={loading} type="submit">
              Register Credentials
            </Button>
            <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
               Already registered? <Link to="/login" className="text-blue-600 hover:underline">Access Portal</Link>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- Dashboard Component (Charts & Stats) ---

const Dashboard = ({ user }: { user: User }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const path = user.role === 'HOD' ? '/hod/stats' : '/teacher/stats';
        const data = await api.get(path);
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  const handleExportHOD = async () => {
    try {
      setLoading(true);
      const allData = await api.get('/hod/consolidated-data');
      const allFiles = await api.get('/files');
      
      const wb = XLSX.utils.book_new();
      
      // Institutional Summary
      const summary = [
        ['NAAC Institutional Progress Report'],
        ['Generated On', new Date().toLocaleString()],
        [''],
        ['Metric', 'Value'],
        ['Total Faculty', stats?.totalTeachers || 0],
        ['Faculty Active', stats?.teachersStarted || 0],
        ['Total Evidence Files', stats?.totalFiles || 0],
        ['Pending HOD Reviews', stats?.pendingVerifications || 0],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Summary');

      // Consolidated Data Sheet
      const consolidatedRows = allData.map((d: any) => ({
        Teacher: d.teacherName,
        Department: d.department,
        Criterion: d.criterionType,
        Status: d.status,
        'Last Update': new Date(d.updatedAt).toLocaleString()
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(consolidatedRows), 'Consolidated Raw Data');

      XLSX.writeFile(wb, `Institutional_NAAC_Consolidated_${new Date().getFullYear()}.xlsx`);
      setNotification({ message: 'Consolidated report downloaded successfully', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
      setNotification({ message: 'Export failed', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTeacherPDF = async () => {
    try {
      setLoading(true);
      const data = await api.get('/criteria/all');
      const files = await api.get('/files');
      exportToPDF(user, data, files);
      setNotification({ message: 'Personal PDF report generated', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ message: 'Export failed', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTeacherExcel = async () => {
    try {
      setLoading(true);
      const data = await api.get('/criteria/all');
      const files = await api.get('/files');
      exportToExcel(user, data, files);
      setNotification({ message: 'Personal Excel data generated', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ message: 'Export failed', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Clock className="animate-spin text-slate-300" /></div>;

  return (
    <div className="space-y-8 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              notification.type === 'success' 
                ? "bg-emerald-500/90 border-emerald-400 text-white" 
                : "bg-red-500/90 border-red-400 text-white"
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">System Overview</h2>
          <p className="text-slate-500 text-sm">Institutional analytics for the 2023-24 assessment cycle.</p>
        </div>
        <div className="flex gap-2">
           {user.role === 'HOD' ? (
             <Button 
              variant="outline" 
              size="sm" 
              className="bg-white border-blue-200"
              onClick={handleExportHOD}
             >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                Consolidated Sheet
             </Button>
           ) : (
             <>
               <Button 
                variant="outline" 
                size="sm" 
                className="bg-white"
                onClick={handleExportTeacherPDF}
               >
                  <FileDown className="w-4 h-4 mr-2 text-red-500" />
                  PDF Report
               </Button>
               <Button 
                variant="outline" 
                size="sm" 
                className="bg-white"
                onClick={handleExportTeacherExcel}
               >
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                  Excel Data
               </Button>
             </>
           )}
           {user.role === 'TEACHER' && (
             <Link to="/criteria">
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Data Entry
                </Button>
             </Link>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {user.role === 'HOD' ? (
          <>
            <StatCard label="Registered Faculty" value={stats?.totalTeachers || 0} icon={Users} trend={`${stats?.teachersStarted || 0} have started entry`} />
            <StatCard label="Total Documents" value={stats?.totalFiles || 0} icon={Upload} color="text-blue-600" trend="+124 new" />
            <StatCard label="Review Required" value={stats?.pendingVerifications || 0} icon={Clock} color="text-amber-500" highlight />
            <StatCard label="Department Readiness" value={`${Math.round(((stats?.teachersStarted || 0) / (stats?.totalTeachers || 1)) * 100)}%`} icon={ShieldCheck} color="text-blue-600" subValue="VERIFIED_PARTICIPATION" />
          </>
        ) : (
          <>
            <StatCard label="Criteria Filed" value={stats?.stats?.length || 0} icon={FileText} />
            <StatCard label="Files Uploaded" value={stats?.totalFiles || 0} icon={Upload} color="text-blue-600" />
            <StatCard label="Approved Data" value={stats?.stats?.filter((s:any) => s.approved > 0).length || 0} icon={CheckCircle2} color="text-emerald-500" />
            <StatCard label="Current Progress" value={`${Math.round(((stats?.stats?.filter((s:any) => s.approved > 0).length || 0) / 7) * 100)}%`} icon={BarChart3} color="text-blue-600" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Criteria Progress Matrix">
          <div className="h-64 pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={NAAC_CRITERIA.map(c => {
                   const d = stats?.criterionStats?.find((s:any) => s.criterionType === c.id) || stats?.stats?.find((s:any) => s.criterionType === c.id);
                   return { name: c.id, count: d?.count || 0, approved: d?.approved || 0 };
                })}
              >
                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                  contentStyle={{ borderRadius: '4px', border: '1px solid #e2e8f0', boxShadow: 'none', fontSize: '10px' }}
                />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {NAAC_CRITERIA.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2563eb' : '#cbd5e1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Recent Activity Audit">
          <div className="space-y-4 pt-4 overflow-hidden">
            {(user.role === 'HOD' ? (stats.recentLogs || []) : (stats.recentActivity || [])).map((log: any, i: number) => (
              <div key={i} className="flex gap-3">
                <div className={cn(
                  "w-8 h-8 rounded shrink-0 flex items-center justify-center",
                  log.action?.includes('UPLOAD') ? "bg-blue-100 text-blue-600" : 
                  log.action?.includes('VERIFY') ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600"
                )}>
                  {log.action?.includes('UPLOAD') ? <Upload className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-700 leading-tight uppercase tracking-tight">{log.action}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{log.details || log.action}</p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 border-t border-slate-100 pt-4">
             <Link to="/audit" className="w-full">
                <Button variant="outline" className="w-full text-[10px] font-bold uppercase tracking-widest bg-gray-50 border-gray-100">View Full Audit Trail</Button>
             </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color = 'text-slate-900', trend, subValue, highlight }: any) => (
  <Card className={cn("hover:border-slate-300 transition-all", highlight && "border-amber-200 bg-amber-50/20")}>
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</span>
      <span className={cn("text-3xl font-light", color)}>{value}</span>
      {trend && <p className="text-[10px] text-emerald-600 mt-2 font-bold uppercase tracking-wider">{trend}</p>}
      {subValue && <p className="text-[10px] text-blue-600 mt-2 font-mono font-bold tracking-tight">{subValue}</p>}
      {!trend && !subValue && <div className="h-4 mt-2" />}
    </div>
  </Card>
);

const Plus = ({ className }: any) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

// --- Criteria Page Components ---

const CriteriaPage = ({ user, targetUserId }: { user: User, targetUserId?: number }) => {
  const [selectedCriterion, setSelectedCriterion] = useState(NAAC_CRITERIA[0]);
  const [criterionData, setCriterionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchCriterionData = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
      setCriterionData([]);
    }
    try {
      const endpoint = targetUserId 
        ? `/hod/teacher-data/${targetUserId}?criterionType=${selectedCriterion.id}` 
        : `/criteria/${selectedCriterion.id}`;
      const data = await api.get(endpoint);
      setCriterionData(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriterionData(true);
  }, [selectedCriterion.id, targetUserId]);

  const handleSave = async (data: any) => {
    if (!data) return;
    try {
      console.log('--- STARTING SAVE ---');
      console.log('Sending data for criterion:', selectedCriterion.id);
      
      // Calculate completeness
      const isComplete = selectedCriterion.fields.every((field: any) => {
        const val = data[field.id];
        if (field.required) {
          if (field.type === 'file') {
            return val && (typeof val === 'object' ? !!val.id : !!val);
          }
          return val !== undefined && val !== null && val !== '';
        }
        return true;
      });

      const status = isComplete ? 'SUBMITTED' : 'PENDING';
      
      const payload = {
        criterionType: selectedCriterion.id,
        subCriterionId: selectedCriterion.id, // Using same ID for simplicity
        status,
        data
      };

      await api.post('/criteria/save', payload);
      await fetchCriterionData(); 
      setNotification({ message: 'Progress saved successfully. You can continue or submit later.', type: 'success' });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error('--- SAVE ERROR ---', err);
      setNotification({ message: 'Save failed: ' + (err as any).message, type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleVerify = async (dataId: number, status: string, comments: string) => {
    try {
      await api.post('/hod/verify', { dataId, status, comments });
      await fetchCriterionData();
      setNotification({
        message: status === 'APPROVED' ? 'Submission Approved Successfully' : 'Revision Requested Successfully',
        type: 'success'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Verification error:', err);
      setNotification({ message: 'Verification failed', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const currentData = criterionData.find(d => d.subCriterionId === selectedCriterion.id);

  return (
    <div className="space-y-8 max-w-5xl mx-auto relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              notification.type === 'success' 
                ? "bg-emerald-500/90 border-emerald-400 text-white" 
                : "bg-red-500/90 border-red-400 text-white"
            )}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-white" />
            ) : (
              <AlertCircle className="w-5 h-5 text-white" />
            )}
            <span className="font-bold text-sm tracking-tight">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center text-center gap-6 border-b border-slate-200 pb-10">
        <div>
          <div className="flex items-center justify-center gap-2 mb-3">
             <div className="bg-blue-600 text-white px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider">{selectedCriterion.id}</div>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Institutional Criterion</p>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">{selectedCriterion.title}</h2>
          <p className="text-slate-500 text-sm mt-3 max-w-2xl mx-auto">{selectedCriterion.description}</p>
        </div>
        
        <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
          {NAAC_CRITERIA.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCriterion(c)}
              className={cn(
                "w-12 h-10 rounded-sm flex items-center justify-center font-bold text-xs shrink-0 transition-all",
                selectedCriterion.id === c.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {c.id}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card title={`${selectedCriterion.title} Form`}>
           {loading ? (
             <div className="flex justify-center p-12"><Clock className="animate-spin text-slate-300" /></div>
           ) : (
             <DataForm 
               user={user}
               sub={selectedCriterion} 
               criterionId={selectedCriterion.id}
               fields={selectedCriterion.fields}
               existing={currentData} 
               onSave={handleSave} 
               onVerify={handleVerify}
             />
           )}
        </Card>
      </div>
    </div>
  );
};

const DataForm = ({ sub, fields, criterionId, existing, onSave, user, onVerify }: any) => {
  const [formData, setFormData] = useState<any>(() => {
    if (!existing?.data) return {};
    try {
      return JSON.parse(existing.data) || {};
    } catch (e) {
      return {};
    }
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [comments, setComments] = useState(existing?.comments || '');

  // Reset form when existing data changes (e.g. switching criteria or target teacher)
  useEffect(() => {
    if (existing?.data) {
      try {
        setFormData(JSON.parse(existing.data));
      } catch (e) {
        setFormData({});
      }
    } else {
      setFormData({});
    }
    setComments(existing?.comments || '');
  }, [existing]);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    console.log('--- SUBMITTING FORM ---');
    setLoading(true);
    try {
      await onSave(formData);
      console.log('--- FORM SUBMITTED SUCCESSFULLY ---');
    } catch (err) {
      console.error('--- FORM SUBMISSION FAILED ---', err);
    } finally {
      setLoading(false);
    }
  };

  const renderField = () => {
    // If HOD is viewing, show readonly data and verification form
    if (user.role === 'HOD') {
      let data = formData;
      if (Object.keys(data).length === 0 && existing?.data) {
        try {
          data = JSON.parse(existing.data);
        } catch (e) {
          data = {};
        }
      }
      
      return (
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded border border-slate-100">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Teacher's Submission</p>
             {existing ? (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {fields.map((f: any) => (
                    <div key={f.id} className="p-3 bg-white rounded border border-slate-100">
                       <label className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
                       <p className="text-xs font-bold text-slate-800 flex items-center justify-between group">
                          <span>
                            {data[f.id] ? (f.type === 'file' ? (typeof data[f.id] === 'object' ? data[f.id].originalName : 'Document Attached') : String(data[f.id])) : '—'}
                          </span>
                          {f.type === 'file' && data[f.id] && (
                            <button 
                              onClick={() => {
                                const fileData = data[f.id];
                                const id = typeof fileData === 'object' ? fileData.id : fileData;
                                const name = typeof fileData === 'object' ? fileData.originalName : 'document.pdf';
                                api.download(`/files/download/${id}`, name);
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-blue-600 transition-colors"
                              title="Download document"
                            >
                              <FileDown className="w-3 h-3" />
                            </button>
                          )}
                       </p>
                    </div>
                  ))}
               </div>
             ) : <p className="text-sm text-slate-400 italic">No data submitted yet.</p>}
          </div>

          <div className="pt-6 border-t border-slate-100">
             <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">HOD Verification & Feedback</label>
                <textarea 
                  className="w-full h-32 bg-white border border-slate-200 rounded p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-sans"
                  placeholder="Provide feedback or reasons for revision..."
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
                <div className="flex gap-2">
                   <Button 
                     type="button" 
                     className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold text-[10px] uppercase tracking-widest" 
                     onClick={() => onVerify(existing?.id, 'APPROVED', comments)}
                     disabled={!existing}
                   >
                      Approve Submission
                   </Button>
                   <Button 
                     type="button" 
                     variant="danger" 
                     className="flex-1 font-bold text-[10px] uppercase tracking-widest" 
                     onClick={() => onVerify(existing?.id, 'REVISION', comments)}
                     disabled={!existing}
                   >
                      Request Revision
                   </Button>
                </div>
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {user.role === 'TEACHER' && existing?.status === 'REVISION' && (
           <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <div className="bg-red-600 p-1.5 rounded-lg">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-red-900 uppercase tracking-[0.2em] mb-1">Feedback / Action Required</p>
                <p className="text-sm font-medium text-red-700">{existing.comments || 'Please review and resubmit this metric.'}</p>
              </div>
           </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map((field: any) => (
          <div key={field.id} className={cn(
            field.type === 'textarea' || field.type === 'multiselect' ? "md:col-span-2" : ""
          )}>
            {field.type === 'textarea' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                <textarea 
                  className="w-full h-32 bg-slate-50 border border-slate-200 rounded p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  placeholder={field.placeholder}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                />
              </div>
            ) : field.type === 'dropdown' || field.type === 'year' ? (
              <Select 
                label={field.label}
                options={field.type === 'year' 
                  ? Array.from({ length: 10 }, (_, i) => ({ value: String(2016 + i), label: String(2016 + i) }))
                  : field.options.map((o: any) => ({ value: o, label: o }))
                }
                value={formData[field.id] || ''}
                onChange={(e: any) => setFormData({ ...formData, [field.id]: e.target.value })}
                required={field.required}
              />
            ) : field.type === 'radio' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{field.label}</label>
                <div className="flex gap-4">
                  {field.options.map((opt: string) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name={field.id} 
                        value={opt}
                        checked={formData[field.id] === opt}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : field.type === 'file' ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                <div 
                  onClick={() => document.getElementById(`file-${field.id}`)?.click()}
                  className={cn(
                    "p-4 border border-dashed rounded flex flex-col items-center justify-center gap-2 transition-all cursor-pointer",
                    formData[field.id] 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                      : "bg-blue-50/50 border-blue-200 text-blue-600 hover:bg-blue-100/50"
                  )}
                >
                  {uploading === field.id ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : formData[field.id] ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center truncate px-2 max-w-full">
                    {uploading === field.id 
                      ? 'Uploading...' 
                      : formData[field.id] 
                        ? (typeof formData[field.id] === 'object' ? formData[field.id].originalName : 'Evidence Attached') 
                        : 'Click to Attach Evidence'}
                  </p>
                  {formData[field.id] && uploading !== field.id && (
                    <div className="flex gap-2 mt-1">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const val = formData[field.id];
                          const id = typeof val === 'object' ? val.id : val;
                          const name = typeof val === 'object' ? val.originalName : 'document.pdf';
                          api.download(`/files/download/${id}`, name);
                        }}
                        className="text-[8px] font-bold uppercase tracking-widest text-blue-600 hover:underline"
                      >
                        Download
                      </button>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const next = { ...formData };
                          delete next[field.id];
                          setFormData(next);
                        }}
                        className="text-[8px] font-bold uppercase tracking-widest text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <input 
                    id={`file-${field.id}`}
                    type="file"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploading(field.id);
                        const fd = new FormData();
                        fd.append('file', file);
                        fd.append('criterionType', criterionId);
                        fd.append('subCriterionId', sub.id);
                        try {
                          const res = await api.upload('/files/upload', fd);
                          setFormData({ 
                            ...formData, 
                            [field.id]: {
                              id: res.id,
                              filename: res.filename,
                              originalName: res.originalName
                            } 
                          });
                        } catch (err: any) {
                          console.error(err);
                          alert('Upload failed: ' + err.message);
                        } finally {
                          setUploading(null);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            ) : field.type === 'date' ? (
              <Input 
                label={field.label}
                type="date"
                value={formData[field.id] || ''}
                onChange={(e: any) => setFormData({ ...formData, [field.id]: e.target.value })}
                required={field.required}
              />
            ) : field.type === 'multiselect' ? (
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                 <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded">
                    {field.options.map((opt: string) => {
                      const current = formData[field.id] || [];
                      const isSelected = current.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            const next = isSelected 
                              ? current.filter((x: any) => x !== opt)
                              : [...current, opt];
                            setFormData({ ...formData, [field.id]: next });
                          }}
                          className={cn(
                            "px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all",
                            isSelected ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "bg-white text-slate-400 border border-slate-200 hover:border-slate-300"
                          )}
                        >
                          {opt}
                        </button>
                      );
                    })}
                 </div>
              </div>
            ) : (
              <Input 
                label={field.label}
                type={field.type === 'decimal' ? 'number' : field.type}
                step={field.type === 'decimal' ? '0.01' : undefined}
                placeholder={field.placeholder}
                value={formData[field.id] || ''}
                onChange={(e: any) => setFormData({ ...formData, [field.id]: e.target.value })}
                required={field.required}
              />
            )}
          </div>
        ))}
      </div>
    </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {renderField()}
      {user.role === 'TEACHER' && (
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="outline" type="button" onClick={() => onSave(null)}>Discard</Button>
          <Button loading={loading} type="submit">Affirm & Save</Button>
        </div>
      )}
    </form>
  );
};

// --- File Manager Page ---

const FileManager = ({ user }: { user: User }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState('C1');

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const data = await api.get('/files');
      setFiles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('criterionType', selectedCriterion);
    formData.append('subCriterionId', selectedCriterion);

    try {
      await api.upload('/files/upload', formData);
      fetchFiles();
      alert('Upload successful');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Evidence Repository</h2>
          <p className="text-slate-500 text-sm">Secure storage for all supporting documentation.</p>
        </div>
        
        <div className="flex gap-2">
           <label className={cn(
             "cursor-pointer inline-flex items-center justify-center rounded font-bold text-[10px] uppercase tracking-widest px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm",
             uploading && "opacity-50 pointer-events-none"
           )}>
             <Upload className="w-4 h-4 mr-2" />
             {uploading ? 'Processing...' : 'Upload Document'}
             <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
           </label>
        </div>
      </div>

      <div className="max-w-md mx-auto md:mx-0">
         <Select 
           label="Criterion Mapping" 
           options={NAAC_CRITERIA.map(c => ({ value: c.id, label: c.title }))}
           value={selectedCriterion}
           onChange={(e:any) => setSelectedCriterion(e.target.value)}
         />
      </div>

      <Card className="p-0 border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
               <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Details</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mapping</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Size</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {files.map(file => (
                <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-none mb-1">{file.originalName}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{new Date(file.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{file.criterionType}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                        <div className={cn("w-1 h-1 rounded-full", file.status === 'VERIFIED' ? "bg-emerald-500" : "bg-amber-500")} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{file.status}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-slate-400 font-medium">
                    {(file.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => api.download(`/files/download/${file.id}`, file.originalName)} className="p-2 hover:bg-slate-100 rounded transition-colors group">
                          <FileDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {files.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[10px] uppercase font-bold tracking-widest text-slate-400 italic">No evidence uploaded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

// --- HOD Pages ---

const FacultyManagement = ({ user }: { user: User }) => {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [reminding, setReminding] = useState<number | null>(null);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const data = await api.get('/hod/teachers');
      setTeachers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemind = async (teacherId: number) => {
    setReminding(teacherId);
    try {
      await api.post('/hod/remind', { 
        teacherId, 
        message: 'Kindly update your pending NAAC criteria for this cycle.' 
      });
      alert('Reminder logged and scheduled for notification.');
    } catch (err) {
      alert('Failed to send reminder');
    } finally {
      setReminding(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Faculty Compliance Hub</h2>
          <p className="text-slate-500 text-sm">Monitor participation, verify metrics, and manage departmental reporting.</p>
        </div>
        <div className="bg-blue-50 border border-blue-100 px-4 py-2 rounded-lg flex items-center gap-3">
           <Users className="w-5 h-5 text-blue-600" />
           <div>
              <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest leading-none">Participation Rate</p>
              <p className="text-sm font-bold text-blue-700 mt-1">{Math.round((teachers.filter(t => t.stats.total > 0).length / (teachers.length || 1)) * 100)}% Active</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="p-0 border-slate-200 shadow-sm overflow-hidden" title="Detailed Faculty Progress Matrix">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                   <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Faculty Member</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Criterion Status (C1 - C7)</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Activity</th>
                   <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map(teacher => (
                  <tr key={teacher.id} className="hover:bg-slate-50/50 transition-colors">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold font-mono">
                              {teacher.name.split(' ').map((n:any) => n[0]).join('')}
                           </div>
                           <div>
                              <p className="text-sm font-bold text-slate-800">{teacher.name}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{teacher.department}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex gap-1">
                           {NAAC_CRITERIA.map(c => {
                              const status = teacher.criterionDetails?.find((d:any) => d.criterionType === c.id)?.status;
                              let statusColor = 'bg-slate-200';
                              if (status === 'APPROVED') statusColor = 'bg-emerald-500';
                              else if (status === 'SUBMITTED') statusColor = 'bg-blue-500';
                              else if (status === 'REVISION') statusColor = 'bg-red-500';
                              
                              return (
                                <div key={c.id} className="group relative">
                                   <div className={cn("w-6 h-1.5 rounded-full transition-all", statusColor)} />
                                   <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-50">
                                      <div className="bg-slate-900 text-white text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                         {c.id}: {status || 'NOT STARTED'}
                                      </div>
                                   </div>
                                </div>
                              );
                           })}
                        </div>
                        <p className="text-[9px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                           {teacher.stats.total} entries • {teacher.stats.approved} verified
                        </p>
                     </td>
                     <td className="px-6 py-4">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">
                              {teacher.stats.lastActivity ? new Date(teacher.stats.lastActivity).toLocaleDateString() : '—'}
                           </span>
                           <span className="text-[9px] text-slate-400 font-medium">
                              {teacher.stats.lastActivity ? new Date(teacher.stats.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No records found'}
                           </span>
                        </div>
                     </td>
                     <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white text-[10px] uppercase font-bold tracking-widest border-slate-200"
                            onClick={() => setSelectedTeacher(teacher)}
                           >
                              Review Data
                           </Button>
                           <Button 
                            variant="secondary" 
                            size="sm" 
                            className="text-[10px] uppercase font-bold tracking-widest"
                            onClick={() => handleRemind(teacher.id)}
                            loading={reminding === teacher.id}
                           >
                              Remind
                           </Button>
                        </div>
                     </td>
                  </tr>
                ))}
                {teachers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 italic">No faculty members found in your department.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Teacher Detail Inspection Overlay */}
      <AnimatePresence>
        {selectedTeacher && (
           <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden"
              >
                 <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {selectedTeacher.name[0]}
                       </div>
                       <div>
                          <h3 className="font-bold text-slate-900">{selectedTeacher.name}'s Progress</h3>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Read-Only Administrative View</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="bg-white text-[10px] uppercase font-bold tracking-widest"
                         onClick={async () => {
                           try {
                             const data = await api.get(`/hod/teacher-data/${selectedTeacher.id}`);
                             const files = await api.get(`/files`); // HOD gets all, so we filter
                             const teacherFiles = files.filter((f: any) => f.userId === selectedTeacher.id);
                             exportToPDF(selectedTeacher, data, teacherFiles);
                           } catch (err) {
                             alert('Failed to generate PDF');
                           }
                         }}
                       >
                         <FileDown className="w-4 h-4 mr-2 text-red-500" />
                         PDF Report
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="bg-white text-[10px] uppercase font-bold tracking-widest"
                         onClick={async () => {
                           try {
                             const data = await api.get(`/hod/teacher-data/${selectedTeacher.id}`);
                             const files = await api.get(`/files`);
                             const teacherFiles = files.filter((f: any) => f.userId === selectedTeacher.id);
                             exportToExcel(selectedTeacher, data, teacherFiles);
                           } catch (err) {
                             alert('Failed to generate Excel');
                           }
                         }}
                       >
                         <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
                         Excel Matrix
                       </Button>
                       <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                       <button 
                         onClick={() => setSelectedTeacher(null)}
                         className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
                       >
                          <X className="w-5 h-5 text-slate-400" />
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 gap-12">
                       <CriteriaPage user={user} targetUserId={selectedTeacher.id} />
                    </div>
                 </div>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AuditLogs = ({ user }: { user: User }) => {
   const [logs, setLogs] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     api.get('/hod/audit-logs').then(setLogs).finally(() => setLoading(false));
   }, []);

   return (
     <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">System Audit Logs</h2>
          <p className="text-slate-500 text-sm">Review institutional activity for internal quality assurance (IQAC).</p>
        </div>

        <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Execution Timestamp</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issuer</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action Code</th>
                       <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Operation Context</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {logs.map(log => (
                     <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded bg-slate-900 text-white text-[10px] flex items-center justify-center font-bold italic">{log.userName[0]}</div>
                              <span className="text-xs font-bold text-slate-700">{log.userName}</span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                           <span className={cn(
                             "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border",
                             log.action.includes('UPLOAD') ? "bg-blue-50 text-blue-600 border-blue-100" :
                             log.action.includes('DELETE') ? "bg-red-50 text-red-600 border-red-100" :
                             "bg-emerald-50 text-emerald-600 border-emerald-100"
                           )}>
                             {log.action.replace('_', ' ')}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-slate-500 italic max-w-xs truncate">
                           {log.details}
                        </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
           </div>
        </Card>
     </div>
   );
};

// --- Main App Entry ---

export default function App() {
  const { user, login, logout, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Loading portal...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage login={login} /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignupPage login={login} /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route 
          path="/*" 
          element={
            user ? (
              <Layout user={user} logout={logout}>
                <Routes>
                  <Route path="/" element={<Dashboard user={user} />} />
                  <Route path="/criteria" element={<CriteriaPage user={user} />} />
                  <Route path="/files" element={<FileManager user={user} />} />
                  
                  {/* HOD Only */}
                  {user.role === 'HOD' && (
                    <>
                      <Route path="/teachers" element={<FacultyManagement user={user} />} />
                      <Route path="/audit" element={<AuditLogs user={user} />} />
                    </>
                  )}
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </Layout>
            ) : <Navigate to="/login" />
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Plus,
  Trash2,
  Save,
  LogOut,
  Dumbbell,
  ChevronRight,
  UserPlus,
  LineChart as LineChartIcon,
  X,
  TrendingUp,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  Calendar,
  Clock,
  AlertCircle,
  MessageCircle,
  Menu,
  Search,
  Wallet,
  CheckCircle,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Download
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LineChart,
  Line,
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Brush
} from 'recharts';

interface Student {
  id: string;
  password: string;
  name: string;
  package?: string;
  start_date?: string;
  expiry_date?: string;
  whatsapp_no?: string;
}

interface Measurement {
  id: number;
  student_id: string;
  week: string;
  weight: number;
  waist?: number;
  chest?: number;
  month?: string;
  hip?: number;
  thighs?: number;
  arms?: number;
  calves?: number;
  lower_belly?: number;
}

export default function AdminDashboard() {
  // ── Admin Authentication Gate ──
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem('adminAuth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthLoading(true);
    setAdminAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@123', password: adminPassword })
      });
      const data = await res.json();

      if (res.ok && data.role === 'admin') {
        sessionStorage.setItem('adminAuth', 'true');
        setIsAdminAuthenticated(true);
      } else {
        setAdminAuthError('Invalid admin password');
        setAdminPassword('');
      }
    } catch {
      setAdminAuthError('Connection error. Try again.');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  // Responsive state for mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [measurementsMonthly, setMeasurementsMonthly] = useState<any[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [newStudent, setNewStudent] = useState({ 
    id: '', 
    password: '', 
    name: '',
    package: '1 month',
    startDate: new Date().toISOString().split('T')[0],
    whatsappNo: ''
  });
  const [editStudent, setEditStudent] = useState({ 
    id: '', 
    password: '', 
    name: '',
    package: '1 month',
    startDate: '',
    whatsappNo: ''
  });
  const [newMeasurement, setNewMeasurement] = useState({ weight: '', waist: '', chest: '', hip: '', thighs: '', arms: '', calves: '', lower_belly: '', month: '' });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [dashboardFilter, setDashboardFilter] = useState<'all' | 'active' | 'expiring_soon' | 'expired' | null>(null);

  // Renewal states
  const [renewingStudent, setRenewingStudent] = useState<Student | null>(null);
  const [renewalPlan, setRenewalPlan] = useState('1 month');
  const [renewalStartDate, setRenewalStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewalWeight, setRenewalWeight] = useState('');
  const [renewalWaist, setRenewalWaist] = useState('');
  const [renewalChest, setRenewalChest] = useState('');
  const [renewalHip, setRenewalHip] = useState('');
  const [renewalThighs, setRenewalThighs] = useState('');
  const [renewalArms, setRenewalArms] = useState('');
  const [renewalCalves, setRenewalCalves] = useState('');
  const [renewalLowerBelly, setRenewalLowerBelly] = useState('');
  const [renewalMonth, setRenewalMonth] = useState('');
  const [renewalPaymentDate, setRenewalPaymentDate] = useState('');

  // Enroll initial measurements
  const [enrollWeight, setEnrollWeight] = useState('');
  const [enrollWaist, setEnrollWaist] = useState('');
  const [enrollChest, setEnrollChest] = useState('');
  const [enrollHip, setEnrollHip] = useState('');
  const [enrollThighs, setEnrollThighs] = useState('');
  const [enrollArms, setEnrollArms] = useState('');
  const [enrollCalves, setEnrollCalves] = useState('');
  const [enrollLowerBelly, setEnrollLowerBelly] = useState('');
  const [enrollMonth, setEnrollMonth] = useState(() => new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }));

  // Personal training price
  const [personalTrainingPrice, setPersonalTrainingPrice] = useState(7000);
  const [editingPTPrice, setEditingPTPrice] = useState(false);
  const [ptPriceInput, setPtPriceInput] = useState('7000');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  };

  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (renewingStudent) {
      setRenewalPlan(renewingStudent.package || '1 month');
      setRenewalStartDate(new Date().toISOString().split('T')[0]);
      setRenewalWeight('');
      setRenewalWaist('');
      setRenewalChest('');
      setRenewalHip('');
      setRenewalThighs('');
      setRenewalArms('');
      setRenewalCalves('');
      setRenewalLowerBelly('');
      setRenewalPaymentDate(new Date().toISOString().split('T')[0]);
      const now = new Date();
      setRenewalMonth(now.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
    }
  }, [renewingStudent]);

  useEffect(() => {
    if (dashboardFilter !== null && listRef.current) {
      setTimeout(() => {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [dashboardFilter]);

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchStudents();
      fetchPTPrice();
    }
  }, [isAdminAuthenticated]);

  const fetchPTPrice = async () => {
    try {
      const res = await fetch('/api/settings/personal-training-price');
      const data = await res.json();
      setPersonalTrainingPrice(data.price);
      setPtPriceInput(String(data.price));
    } catch {}
  };

  const handleUpdatePTPrice = async () => {
    try {
      const res = await fetch('/api/admin/settings/personal-training-price', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: parseInt(ptPriceInput) })
      });
      if (res.ok) {
        const data = await res.json();
        setPersonalTrainingPrice(data.price);
        setEditingPTPrice(false);
        showToast('Price updated successfully');
      } else {
        showToast('Failed to update price', 'error');
      }
    } catch {
      showToast('Connection error. Please try again.', 'error');
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      fetchMeasurements(selectedStudent.id);
      setEditStudent({ 
        id: selectedStudent.id, 
        password: selectedStudent.password, 
        name: selectedStudent.name,
        package: selectedStudent.package || '1 month',
        startDate: selectedStudent.start_date || '',
        whatsappNo: selectedStudent.whatsapp_no || ''
      });
      setIsEditingStudent(false);
    }
  }, [selectedStudent]);

  // ── If not authenticated, render the login gate ──
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center px-6">
        {/* Animated background accents */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-yellow/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-yellow/3 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-md"
        >
          {/* Card */}
          <div className="bg-brand-darkgrey/60 backdrop-blur-xl border border-white/5 rounded-3xl p-10 shadow-2xl shadow-black/40">
            {/* Shield Icon */}
            <div className="flex justify-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/5 border border-brand-yellow/20 flex items-center justify-center"
              >
                <ShieldCheck className="w-10 h-10 text-brand-yellow" />
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-display text-white mb-2">Admin Portal</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/30">
                Restricted Access • Authentication Required
              </p>
            </div>

            {/* Error */}
            {adminAuthError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-mono"
              >
                {adminAuthError}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 ml-1">
                  Admin Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:border-brand-yellow/50 focus:bg-brand-black/80 transition-all outline-none text-sm text-white placeholder-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showAdminPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={adminAuthLoading}
                className="w-full py-4 bg-brand-yellow text-brand-black font-bold uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 text-sm"
              >
                {adminAuthLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Authenticate
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-[10px] text-white/20 uppercase tracking-widest">
                Secure Encryption Enabled • Flexi Fitness Academy
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleRenewalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingStudent) return;
    
    const expiryDate = calculateExpiryDate(renewalStartDate, renewalPlan);
    const encodedId = encodeURIComponent(renewingStudent.id);
    
    try {
      // 1. Update student plan details
      const studentRes = await fetch(`/api/admin/students/${encodedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: renewingStudent.id,
          password: renewingStudent.password,
          name: renewingStudent.name,
          package: renewalPlan,
          start_date: renewalStartDate,
          expiry_date: expiryDate,
          whatsapp_no: renewingStudent.whatsapp_no || '',
          payment_date: renewalPaymentDate
        })
      });
      
      if (!studentRes.ok) {
        throw new Error('Failed to update student plan');
      }
      
      // 2. If weight is provided, log the new measurements
      if (renewalWeight) {
        const measurementRes = await fetch('/api/admin/measurements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: renewingStudent.id,
            month: renewalMonth,
            weight: parseFloat(renewalWeight),
            waist: renewalWaist ? parseFloat(renewalWaist) : null,
            chest: renewalChest ? parseFloat(renewalChest) : null,
            hip: renewalHip ? parseFloat(renewalHip) : null,
            thighs: renewalThighs ? parseFloat(renewalThighs) : null,
            arms: renewalArms ? parseFloat(renewalArms) : null,
            calves: renewalCalves ? parseFloat(renewalCalves) : null,
            lower_belly: renewalLowerBelly ? parseFloat(renewalLowerBelly) : null
          })
        });
        
        if (!measurementRes.ok) {
          console.error('Failed to log renewal measurements');
        }
      }
      
      // 3. Reset state & refresh lists
      setRenewingStudent(null);
      fetchStudents();
      if (selectedStudent?.id === renewingStudent.id) {
        setSelectedStudent({
          ...selectedStudent,
          package: renewalPlan,
          start_date: renewalStartDate,
          expiry_date: expiryDate
        });
      }
      showToast('Renewal successful');
    } catch (err) {
      showToast('Renewal failed. Please try again.', 'error');
      console.error('Renewal failed:', err);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/students');
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    }
  };

  const fetchMeasurements = async (studentId: string) => {
    try {
      const encodedId = encodeURIComponent(studentId);
      const [weeklyRes, monthlyRes] = await Promise.all([
        fetch(`/api/admin/measurements/${encodedId}`),
        fetch(`/api/student/measurements-monthly/${encodedId}`)
      ]);
      const weeklyData = await weeklyRes.json();
      const monthlyData = await monthlyRes.json();
      setMeasurements(weeklyData);
      setMeasurementsMonthly(monthlyData);
    } catch (err) {
      console.error('Failed to fetch measurements:', err);
    }
  };

  const calculateExpiryDate = (startDate: string, pkg: string) => {
    if (!startDate) return '';
    const date = new Date(startDate);
    switch (pkg.toLowerCase().trim()) {
      case '1 month':
        date.setMonth(date.getMonth() + 1);
        break;
      case '3 months':
        date.setMonth(date.getMonth() + 3);
        break;
      case '6 months':
        date.setMonth(date.getMonth() + 6);
        break;
      case '1 year':
      case 'yearly':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }
    return date.toISOString().split('T')[0];
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiryDate = calculateExpiryDate(newStudent.startDate, newStudent.package);
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStudent,
          start_date: newStudent.startDate,
          expiry_date: expiryDate,
          whatsapp_no: newStudent.whatsappNo
        })
      });
      if (res.ok) {
        // Post initial measurements if weight is provided
        if (enrollWeight) {
          await fetch('/api/admin/measurements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              student_id: newStudent.id,
              month: enrollMonth,
              weight: parseFloat(enrollWeight),
              waist: enrollWaist ? parseFloat(enrollWaist) : null,
              chest: enrollChest ? parseFloat(enrollChest) : null,
              hip: enrollHip ? parseFloat(enrollHip) : null,
              thighs: enrollThighs ? parseFloat(enrollThighs) : null,
              arms: enrollArms ? parseFloat(enrollArms) : null,
              calves: enrollCalves ? parseFloat(enrollCalves) : null,
              lower_belly: enrollLowerBelly ? parseFloat(enrollLowerBelly) : null
            })
          });
        }
        setIsAddingStudent(false);
        setNewStudent({ 
          id: '', 
          password: '', 
          name: '',
          package: '1 month',
          startDate: new Date().toISOString().split('T')[0],
          whatsappNo: ''
        });
        setEnrollWeight(''); setEnrollWaist(''); setEnrollChest('');
        setEnrollHip(''); setEnrollThighs(''); setEnrollArms('');
        setEnrollCalves(''); setEnrollLowerBelly('');
        setEnrollMonth(new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }));
        fetchStudents();
        showToast('Student enrolled successfully');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add student', 'error');
        console.error('Failed to add student:', data.error);
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
      console.error('Failed to add student:', err);
    }
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const expiryDate = calculateExpiryDate(editStudent.startDate, editStudent.package);
    try {
      const encodedId = encodeURIComponent(selectedStudent.id);
      const res = await fetch(`/api/admin/students/${encodedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editStudent,
          start_date: editStudent.startDate,
          expiry_date: expiryDate,
          whatsapp_no: editStudent.whatsappNo
        })
      });
      if (res.ok) {
        setIsEditingStudent(false);
        fetchStudents();
        setSelectedStudent({ 
          ...editStudent, 
          start_date: editStudent.startDate, 
          expiry_date: expiryDate,
          whatsapp_no: editStudent.whatsappNo
        });
        showToast('Student updated successfully');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to update student', 'error');
        console.error('Failed to update student:', data.error);
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
      console.error('Failed to update student:', err);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    try {
      const encodedId = encodeURIComponent(selectedStudent.id);
      const res = await fetch(`/api/admin/students/${encodedId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedStudent(null);
        setConfirmDelete(null);
        fetchStudents();
        showToast('Student deleted');
      } else {
        showToast('Failed to delete student', 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
      console.error('Failed to delete student:', err);
    }
  };

  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await fetch('/api/admin/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          student_id: selectedStudent.id, 
          month: newMeasurement.month,
          weight: parseFloat(newMeasurement.weight),
          waist: newMeasurement.waist ? parseFloat(newMeasurement.waist) : null,
          chest: newMeasurement.chest ? parseFloat(newMeasurement.chest) : null,
          hip: newMeasurement.hip ? parseFloat(newMeasurement.hip) : null,
          thighs: newMeasurement.thighs ? parseFloat(newMeasurement.thighs) : null,
          arms: newMeasurement.arms ? parseFloat(newMeasurement.arms) : null,
          calves: newMeasurement.calves ? parseFloat(newMeasurement.calves) : null,
          lower_belly: newMeasurement.lower_belly ? parseFloat(newMeasurement.lower_belly) : null
        })
      });
      if (res.ok) {
        setNewMeasurement({ weight: '', waist: '', chest: '', hip: '', thighs: '', arms: '', calves: '', lower_belly: '', month: '' });
        await fetchMeasurements(selectedStudent.id);
        showToast('Measurement added');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add measurement', 'error');
        console.error('Failed to add measurement:', data.error);
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
      console.error('Failed to add measurement:', err);
    }
  };

  const handleDeleteMeasurement = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/measurements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedStudent) fetchMeasurements(selectedStudent.id);
        showToast('Measurement deleted');
      } else {
        showToast('Failed to delete measurement', 'error');
      }
    } catch (err) {
      showToast('Connection error. Please try again.', 'error');
      console.error('Failed to delete measurement:', err);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    navigate('/login');
  };

  const handleExportExcel = async () => {
    try {
      showToast('Preparing export...');
      const res = await fetch('/api/admin/export');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flexi-academy-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast('Export downloaded successfully');
    } catch (err) {
      showToast('Export failed. Please try again.', 'error');
    }
  };

  // Helper values for filtering & stat calculations
  const today = new Date().toISOString().split('T')[0];

  const getMembershipStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'inactive';
    const [year, month, day] = expiryDate.split('-').map(Number);
    const expiry = new Date(year, month - 1, day);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    if (expiry < now) return 'expired';
    
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) return 'expiring_soon';
    
    return 'active';
  };

  // Package pricing dictionary (INR/Month representation)
  const getPackagePriceInfo = (pkgName?: string) => {
    const p = (pkgName || '').toLowerCase().trim();
    if (p === '1 month') return { total: 2500, duration: 1, monthly: 2500 };
    if (p === '3 months') return { total: 6000, duration: 3, monthly: Math.round(6000 / 3) };
    if (p === '6 months') return { total: 10000, duration: 6, monthly: Math.round(10000 / 6) };
    if (p === 'yearly' || p === '1 year') return { total: 15000, duration: 12, monthly: Math.round(15000 / 12) };
    if (p === 'personal training') return { total: personalTrainingPrice, duration: 1, monthly: personalTrainingPrice };
    return { total: 0, duration: 1, monthly: 0 };
  };

  // Calculations
  const activeStudents = students.filter(s => {
    const status = getMembershipStatus(s.expiry_date);
    return status === 'active' || status === 'expiring_soon';
  });
  const activeStudentsCount = activeStudents.length;
  const expiredStudentsCount = students.filter(s => getMembershipStatus(s.expiry_date) === 'expired').length;
  const expiringSoonCount = students.filter(s => getMembershipStatus(s.expiry_date) === 'expiring_soon').length;

  // Monthly revenue calculation
  const totalMonthlyRevenue = activeStudents.reduce((sum, student) => {
    return sum + getPackagePriceInfo(student.package).monthly;
  }, 0);

  // Package Distribution data for charts
  const packageStats = students.reduce((acc: any, student) => {
    const pkg = student.package || '1 month';
    if (!acc[pkg]) {
      acc[pkg] = { count: 0, activeCount: 0, revenueContribution: 0 };
    }
    acc[pkg].count += 1;
    if (getMembershipStatus(student.expiry_date) !== 'expired') {
      acc[pkg].activeCount += 1;
      acc[pkg].revenueContribution += getPackagePriceInfo(pkg).monthly;
    }
    return acc;
  }, {});

  // Generate last 6 months names and monthly revenue trend
  const getMonthlyRevenueTrend = () => {
    const trendData = [];
    const now = new Date();
    
    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthStr = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);
      
      const monthlyRev = students.reduce((sum, student) => {
        if (!student.start_date || !student.expiry_date) return sum;
        
        const [sYear, sMonth, sDay] = student.start_date.split('-').map(Number);
        const [eYear, eMonth, eDay] = student.expiry_date.split('-').map(Number);
        const studentStart = new Date(sYear, sMonth - 1, sDay);
        const studentExpiry = new Date(eYear, eMonth - 1, eDay);
        
        const isOverlap = studentStart <= endOfMonth && studentExpiry >= startOfMonth;
        
        if (isOverlap) {
          return sum + getPackagePriceInfo(student.package).monthly;
        }
        return sum;
      }, 0);
      
      trendData.push({
        name: monthStr,
        Revenue: monthlyRev
      });
    }
    return trendData;
  };

  const revenueTrendData = getMonthlyRevenueTrend();

  const packageChartData = Object.keys(packageStats).map(key => ({
    name: key.toUpperCase(),
    value: packageStats[key].count,
    active: packageStats[key].activeCount,
    monthlyRevenue: packageStats[key].revenueContribution
  }));

  const COLORS = ['#D4AF37', '#3b82f6', '#10b981', '#a855f7'];

  // Filter students based on search query and dashboardFilter
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchQuery === '' || 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (!matchesSearch) return false;
    
    if (dashboardFilter === null) return true; // Show all for search when no filter is clicked
    if (dashboardFilter === 'all') return true;
    
    const status = getMembershipStatus(student.expiry_date);
    if (dashboardFilter === 'active') return status === 'active' || status === 'expiring_soon';
    if (dashboardFilter === 'expiring_soon') return status === 'expiring_soon';
    if (dashboardFilter === 'expired') return status === 'expired';
    
    return true;
  });

  return (
    <div className="min-h-screen bg-brand-black flex flex-col md:flex-row text-white font-sans antialiased">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[9999] px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium uppercase tracking-widest transition-all ${toast.type === 'error' ? 'bg-red-500/90 text-white' : 'bg-brand-yellow text-brand-black'}`}>
          {toast.message}
        </div>
      )}
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-brand-darkgrey/80 backdrop-blur-md border-b border-white/5 w-full fixed top-0 left-0 z-40">
        <button 
          onClick={() => { setSelectedStudent(null); setIsAddingStudent(false); }}
          className="flex items-center gap-2 text-left"
        >
          <img src="/logo.png" alt="Flexi Academy" className="w-8 h-8 rounded-full object-cover ring-1 ring-gold/50" />
          <div>
            <h1 className="text-sm font-display font-bold text-brand-yellow uppercase tracking-wider">Flexi Academy</h1>
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Admin Panel</p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setIsAddingStudent(true); setSelectedStudent(null); setIsSidebarOpen(false); }}
            className="p-2 hover:bg-white/5 rounded-lg text-brand-yellow transition-all"
            title="Add Student"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-lg bg-brand-yellow text-brand-black hover:bg-white transition-all">
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile overlay when sidebar is open */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`w-72 border-r border-white/5 flex flex-col bg-brand-darkgrey/50 backdrop-blur-xl transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static inset-y-0 left-0 z-50`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <button 
            onClick={() => { setSelectedStudent(null); setIsAddingStudent(false); setIsSidebarOpen(false); }}
            className="flex items-center gap-3 text-left group"
          >
            <img
              src="/logo.png"
              alt="Flexi Academy"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-gold/30 group-hover:ring-gold transition-all"
            />
            <div>
              <span className="text-base font-display font-bold tracking-widest uppercase block">
                Flexi <span className="text-brand-yellow">Academy</span>
              </span>
              <span className="text-[9px] text-white/30 uppercase tracking-widest font-mono">Administration</span>
            </div>
          </button>
          <button className="md:hidden p-1 hover:bg-white/5 rounded-lg" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5 text-white/60 hover:text-white" />
          </button>
        </div>

        {/* Search bar inside Sidebar */}
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-black/60 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm placeholder:text-white/20 text-white outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-gold/20 transition-all font-mono"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Student list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 custom-scrollbar">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold font-mono">Members</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full font-mono text-white/50">{filteredStudents.length}</span>
          </div>

          {/* Quick return to main dashboard button */}
          <button
            onClick={() => { setSelectedStudent(null); setIsAddingStudent(false); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
              !selectedStudent && !isAddingStudent
                ? 'bg-brand-yellow border-brand-yellow/20 text-brand-black shadow-lg shadow-brand-yellow/10 font-bold'
                : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChartIcon className="w-4.5 h-4.5" />
            <span className="text-xs uppercase tracking-wider font-mono">Dashboard Overview</span>
          </button>

          <div className="h-px bg-white/5 my-3" />

          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-white/20 font-mono text-[10px]">
              No members found
            </div>
          ) : (
            filteredStudents.map(student => {
              const status = getMembershipStatus(student.expiry_date);
              const isSelected = selectedStudent?.id === student.id;
              
              return (
                <div
                  key={student.id}
                  onClick={() => { setSelectedStudent(student); setIsAddingStudent(false); setIsSidebarOpen(false); }}
                  role="button"
                  tabIndex={0}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-yellow border-brand-yellow/20 text-brand-black font-medium shadow-md shadow-brand-yellow/5' 
                      : 'text-white/60 border-transparent hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-xs ${isSelected ? 'bg-brand-black/15 text-brand-black font-bold' : 'bg-white/5 text-brand-yellow'}`}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    {student.expiry_date && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${isSelected ? 'border-brand-yellow' : 'border-brand-darkgrey'} ${
                        status === 'expired' 
                          ? 'bg-red-500' 
                          : status === 'expiring_soon'
                            ? 'bg-orange-500'
                            : 'bg-green-500'
                      }`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-xs truncate leading-tight">{student.name}</p>
                    <p className={`text-[10px] truncate leading-normal font-mono ${isSelected ? 'text-brand-black/65' : 'text-white/30'}`}>
                      {student.id}
                    </p>
                  </div>
                  {student.whatsapp_no && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const message = `Hello ${student.name}, this is Flexi Fitness Academy. Just a reminder that your ${student.package} package expires on ${student.expiry_date || 'N/A'}. Please let us know if you would like to renew!`;
                        window.open(`https://wa.me/${student.whatsapp_no.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                      }}
                      className={`p-1.5 rounded-lg transition-all ${
                        isSelected 
                          ? 'hover:bg-brand-black/10 text-brand-black/70 hover:text-brand-black' 
                          : 'hover:bg-white/5 text-white/30 hover:text-green-400'
                      }`}
                      title="Send WhatsApp Reminder"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer / Action */}
        <div className="p-4 border-t border-white/5 space-y-2">
          <button 
            onClick={() => { setIsAddingStudent(true); setSelectedStudent(null); setIsSidebarOpen(false); }}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-brand-yellow hover:text-brand-black border border-white/5 hover:border-transparent rounded-xl text-xs uppercase font-bold tracking-wider transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add New Student
          </button>

          <button 
            onClick={handleExportExcel}
            className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-green-500 hover:text-white border border-white/5 hover:border-transparent rounded-xl text-xs uppercase font-bold tracking-wider transition-all text-green-400"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-white/40 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-xs uppercase font-semibold transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto mt-16 md:mt-0">
        
        {isAddingStudent ? (
          /* ==================== ADD STUDENT FORM ==================== */
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto py-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-display font-bold text-brand-yellow">Add Student Account</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest font-mono mt-1">Register new transformee</p>
              </div>
              <button 
                onClick={() => setIsAddingStudent(false)} 
                className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddStudent} className="space-y-5 bg-brand-darkgrey/30 border border-white/5 p-6 md:p-8 rounded-3xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Student Name</label>
                  <input 
                    type="text" required
                    value={newStudent.name}
                    onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-brand-yellow/50 font-medium"
                    placeholder="E.g., John Doe"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">WhatsApp Number</label>
                  <input 
                    type="text" required
                    value={newStudent.whatsappNo}
                    onChange={e => setNewStudent({...newStudent, whatsappNo: e.target.value})}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-brand-yellow/50 font-mono"
                    placeholder="+919876543210 (with country code)"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Email / ID (Login Username)</label>
                  <input 
                    type="email" required
                    value={newStudent.id}
                    onChange={e => setNewStudent({...newStudent, id: e.target.value})}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-brand-yellow/50 font-mono"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Password</label>
                  <input 
                    type="text" required
                    value={newStudent.password}
                    onChange={e => setNewStudent({...newStudent, password: e.target.value})}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-brand-yellow/50 font-mono"
                    placeholder="Password for login"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Package Plan</label>
                  <select 
                    value={newStudent.package}
                    onChange={e => setNewStudent({...newStudent, package: e.target.value})}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-brand-yellow/50 appearance-none text-white"
                  >
                    <option value="1 month">1 Month Plan (₹2,500)</option>
                    <option value="3 months">3 Months Plan (₹6,000)</option>
                    <option value="6 months">6 Months Plan (₹10,000)</option>
                    <option value="1 year">1 Year Plan (₹15,000)</option>
                    <option value="personal training">Personal Training (₹7,000+)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Start Date</label>
                  <input 
                    type="date" required
                    value={newStudent.startDate}
                    onChange={e => setNewStudent({...newStudent, startDate: e.target.value})}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-4 py-3 outline-none focus:border-brand-yellow/50 text-white font-mono"
                  />
                </div>
              </div>
              
              <div className="p-4 bg-brand-yellow/5 border border-brand-yellow/10 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Calculated Package Expiry</p>
                  <p className="text-sm font-bold text-brand-yellow font-mono mt-0.5">
                    {calculateExpiryDate(newStudent.startDate, newStudent.package) || 'Please set a start date'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Membership Price</p>
                  <p className="text-sm font-bold text-white font-mono mt-0.5">
                    ₹{getPackagePriceInfo(newStudent.package).total.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="h-px bg-white/5" />
              <p className="text-[10px] uppercase font-mono text-brand-yellow font-bold tracking-wider">Initial Body Measurements (Optional)</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Month Period</label>
                  <select value={enrollMonth} onChange={e => setEnrollMonth(e.target.value)}
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 text-xs text-white">
                    {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
                      ['2025','2026','2027'].map(y => <option key={`${m} ${y}`} value={`${m} ${y}`}>{m} {y}</option>)
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Weight (kg)</label>
                  <input type="number" step="0.1" value={enrollWeight} onChange={e => setEnrollWeight(e.target.value)}
                    placeholder="E.g. 70.5"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Waist (cm)</label>
                  <input type="number" step="0.1" value={enrollWaist} onChange={e => setEnrollWaist(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Chest (cm)</label>
                  <input type="number" step="0.1" value={enrollChest} onChange={e => setEnrollChest(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Hip (cm)</label>
                  <input type="number" step="0.1" value={enrollHip} onChange={e => setEnrollHip(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Thighs (cm)</label>
                  <input type="number" step="0.1" value={enrollThighs} onChange={e => setEnrollThighs(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Arms (cm)</label>
                  <input type="number" step="0.1" value={enrollArms} onChange={e => setEnrollArms(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Calves (cm)</label>
                  <input type="number" step="0.1" value={enrollCalves} onChange={e => setEnrollCalves(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Lower Belly (cm)</label>
                  <input type="number" step="0.1" value={enrollLowerBelly} onChange={e => setEnrollLowerBelly(e.target.value)}
                    placeholder="Optional"
                    className="w-full bg-brand-black/50 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                </div>
              </div>

              <button className="w-full py-4 bg-brand-yellow hover:bg-white text-brand-black font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-brand-yellow/5 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200">
                Register Student
              </button>
            </form>
          </motion.div>

        ) : selectedStudent ? (
          /* ==================== SINGLE STUDENT DETAILED VIEW ==================== */
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-brand-darkgrey/30 border border-white/5 p-6 rounded-3xl">
              <div>
                <button 
                  onClick={() => setSelectedStudent(null)} 
                  className="mb-3 flex items-center gap-1.5 text-xs text-brand-yellow hover:text-white transition-all font-mono"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
                </button>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white flex items-center gap-3">
                  {selectedStudent.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">ID: {selectedStudent.id}</span>
                  <div className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold ${
                    getMembershipStatus(selectedStudent.expiry_date) === 'expired' 
                      ? 'bg-red-500/15 text-red-400 border border-red-500/20' 
                      : getMembershipStatus(selectedStudent.expiry_date) === 'expiring_soon'
                        ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                        : 'bg-green-500/15 text-green-400 border border-green-500/20'
                  }`}>
                    <Clock className="w-2.5 h-2.5 animate-pulse" />
                    {getMembershipStatus(selectedStudent.expiry_date) === 'expired' ? 'Expired' : getMembershipStatus(selectedStudent.expiry_date) === 'expiring_soon' ? 'Expiring Soon' : 'Active'}
                  </div>
                  <span className="text-[10px] bg-white/5 border border-white/5 text-brand-yellow px-2.5 py-0.5 rounded-full uppercase font-mono font-bold">
                    {selectedStudent.package}
                  </span>
                </div>
              </div>
              
              {/* Quick Actions Panel */}
              <div className="flex flex-wrap gap-2.5">
                {selectedStudent.expiry_date && (
                  <div className="bg-brand-black/40 border border-white/5 px-4 py-2.5 rounded-2xl flex flex-col justify-center min-w-[120px]">
                    <span className="text-[9px] text-white/30 uppercase font-mono">Package Expiry</span>
                    <span className="font-mono text-xs text-brand-yellow font-bold">{selectedStudent.expiry_date}</span>
                  </div>
                )}
                {getMembershipStatus(selectedStudent.expiry_date) === 'expired' && (
                  <button 
                    onClick={() => setRenewingStudent(selectedStudent)}
                    className="bg-brand-yellow text-brand-black px-4 py-2.5 rounded-2xl hover:bg-white hover:scale-105 active:scale-[0.98] transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer"
                  >
                    Renew Plan
                  </button>
                )}
                {selectedStudent.whatsapp_no && (
                  <button 
                    onClick={() => {
                      const message = `Hello ${selectedStudent.name}, this is Flexi Fitness Academy. Just checking in on your transformation progress. Your membership is active until ${selectedStudent.expiry_date || 'N/A'}. Let us know if you need any workout adjustments!`;
                      window.open(`https://wa.me/${selectedStudent.whatsapp_no.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                    className="bg-green-500/10 border border-green-500/25 p-3 rounded-2xl hover:bg-green-500 hover:text-white transition-all group flex items-center justify-center"
                    title="WhatsApp Student"
                  >
                    <MessageCircle className="w-5 h-5 text-green-400 group-hover:text-white" />
                  </button>
                )}
                <button 
                  onClick={() => setIsEditingStudent(!isEditingStudent)}
                  className="bg-brand-darkgrey/40 border border-white/5 px-4 py-2.5 rounded-2xl hover:border-brand-yellow/50 transition-all text-center flex flex-col justify-center cursor-pointer"
                >
                  <span className="text-[9px] text-white/30 uppercase font-mono">Credentials</span>
                  <span className="font-mono text-xs text-brand-yellow font-bold">{selectedStudent.password}</span>
                </button>
                <button 
                  onClick={() => setConfirmDelete(selectedStudent.id)}
                  className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-2xl hover:bg-red-500 hover:text-white transition-all group flex items-center justify-center cursor-pointer"
                  title="Delete Student"
                >
                  <Trash2 className="w-5 h-5 text-red-400 group-hover:text-white" />
                </button>
              </div>
            </div>

            {confirmDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
                <div className="bg-brand-darkgrey border border-white/10 rounded-3xl p-6 md:p-8 max-w-sm w-full text-center">
                  <h3 className="text-xl font-display font-bold mb-3 text-red-400">Delete Student?</h3>
                  <p className="text-white/40 text-xs font-mono uppercase tracking-wider mb-6">All transformations, history & account access for this student will be permanently erased.</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-3 border border-white/10 rounded-xl text-xs uppercase tracking-widest font-mono font-bold hover:bg-white/5 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeleteStudent}
                      className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs uppercase tracking-widest font-mono font-bold hover:bg-red-600 transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {renewingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
                <div className="bg-brand-darkgrey border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full relative my-8">
                  <button 
                    type="button"
                    onClick={() => setRenewingStudent(null)}
                    className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  
                  <h3 className="text-xl font-display font-bold text-brand-yellow mb-1">Renew Membership</h3>
                  <p className="text-xs text-white/45 font-mono uppercase mb-6">Student: {renewingStudent.name}</p>
                  
                  <form onSubmit={handleRenewalSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Select Plan</label>
                      <select 
                        value={renewalPlan}
                        onChange={e => setRenewalPlan(e.target.value)}
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 appearance-none text-white text-xs"
                      >
                        <option value="1 month">1 Month Plan (₹2,500)</option>
                        <option value="3 months">3 Months Plan (₹6,000)</option>
                        <option value="6 months">6 Months Plan (₹10,000)</option>
                        <option value="1 year">1 Year Plan (₹15,000)</option>
                        <option value="personal training">Personal Training (₹7,000+)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Plan Start Date</label>
                        <input 
                          type="date" required
                          value={renewalStartDate}
                          onChange={e => setRenewalStartDate(e.target.value)}
                          className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 text-white font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Fees Payment Date</label>
                        <input 
                          type="date" required
                          value={renewalPaymentDate}
                          onChange={e => setRenewalPaymentDate(e.target.value)}
                          className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 text-white font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white/5 rounded-2xl flex justify-between items-center text-[10px] font-mono">
                      <div>
                        <span className="text-white/30 uppercase block">New Expiry Date</span>
                        <span className="text-brand-yellow font-bold">{calculateExpiryDate(renewalStartDate, renewalPlan) || 'N/A'}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white/30 uppercase block">Membership Cost</span>
                        <span className="text-white font-bold">₹{getPackagePriceInfo(renewalPlan).total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <div className="h-px bg-white/5 my-2" />
                    <p className="text-[10px] uppercase font-mono text-brand-yellow font-bold tracking-wider">Transformation Starting Metrics (Optional)</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Month Period</label>
                        <select
                          value={renewalMonth}
                          onChange={e => setRenewalMonth(e.target.value)}
                          className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 text-xs text-white"
                        >
                          <option value="Jan 2026">Jan 2026</option>
                          <option value="Feb 2026">Feb 2026</option>
                          <option value="Mar 2026">Mar 2026</option>
                          <option value="Apr 2026">Apr 2026</option>
                          <option value="May 2026">May 2026</option>
                          <option value="Jun 2026">Jun 2026</option>
                          <option value="Jul 2026">Jul 2026</option>
                          <option value="Aug 2026">Aug 2026</option>
                          <option value="Sep 2026">Sep 2026</option>
                          <option value="Oct 2026">Oct 2026</option>
                          <option value="Nov 2026">Nov 2026</option>
                          <option value="Dec 2026">Dec 2026</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Weight (kg)</label>
                        <input 
                          type="number" step="0.1"
                          value={renewalWeight}
                          onChange={e => setRenewalWeight(e.target.value)}
                          placeholder="E.g. 70.5"
                          className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Waist (cm)</label>
                        <input type="number" step="0.1" value={renewalWaist} onChange={e => setRenewalWaist(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Chest (cm)</label>
                        <input type="number" step="0.1" value={renewalChest} onChange={e => setRenewalChest(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Hip (cm)</label>
                        <input type="number" step="0.1" value={renewalHip} onChange={e => setRenewalHip(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Thighs (cm)</label>
                        <input type="number" step="0.1" value={renewalThighs} onChange={e => setRenewalThighs(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Arms (cm)</label>
                        <input type="number" step="0.1" value={renewalArms} onChange={e => setRenewalArms(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Calves (cm)</label>
                        <input type="number" step="0.1" value={renewalCalves} onChange={e => setRenewalCalves(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Lower Belly (cm)</label>
                        <input type="number" step="0.1" value={renewalLowerBelly} onChange={e => setRenewalLowerBelly(e.target.value)}
                          placeholder="Optional" className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white" />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button"
                        onClick={() => setRenewingStudent(null)}
                        className="flex-1 py-3 border border-white/10 rounded-xl text-xs uppercase tracking-widest font-mono font-bold hover:bg-white/5 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-brand-yellow text-brand-black rounded-xl text-xs uppercase tracking-widest font-mono font-bold hover:bg-white transition-all cursor-pointer"
                      >
                        Confirm Renewal
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {isEditingStudent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="p-6 rounded-3xl bg-brand-yellow/5 border border-brand-yellow/15"
              >
                <h3 className="text-lg font-display font-bold text-brand-yellow mb-4">Edit Student Credentials & Plan</h3>
                <form onSubmit={handleUpdateStudent} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Full Name</label>
                    <input 
                      type="text" required
                      value={editStudent.name}
                      onChange={e => setEditStudent({...editStudent, name: e.target.value})}
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">WhatsApp Number</label>
                    <input 
                      type="text" required
                      value={editStudent.whatsappNo}
                      onChange={e => setEditStudent({...editStudent, whatsappNo: e.target.value})}
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Student ID / Email</label>
                    <input 
                      type="text" required
                      value={editStudent.id}
                      onChange={e => setEditStudent({...editStudent, id: e.target.value})}
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Password</label>
                    <input 
                      type="text" required
                      value={editStudent.password}
                      onChange={e => setEditStudent({...editStudent, password: e.target.value})}
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 font-mono text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Package</label>
                    <select 
                      value={editStudent.package}
                      onChange={e => setEditStudent({...editStudent, package: e.target.value})}
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 appearance-none text-white text-sm"
                    >
                      <option value="1 month">1 Month Plan</option>
                      <option value="3 months">3 Months Plan</option>
                      <option value="6 months">6 Months Plan</option>
                      <option value="1 year">1 Year Plan</option>
                      <option value="personal training">Personal Training</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Start Date</label>
                    <input 
                      type="date" required
                      value={editStudent.startDate}
                      onChange={e => setEditStudent({...editStudent, startDate: e.target.value})}
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-4 py-2.5 outline-none focus:border-brand-yellow/50 text-white font-mono text-sm"
                    />
                  </div>
                  <div className="lg:col-span-3 flex justify-end gap-3 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsEditingStudent(false)}
                      className="px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider font-bold border border-white/10 hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-brand-yellow text-brand-black rounded-xl text-xs uppercase tracking-wider font-bold hover:scale-105 transition-transform"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weight Chart */}
              <div className="p-6 md:p-8 rounded-3xl bg-brand-darkgrey/30 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold flex items-center gap-2 text-brand-yellow">
                    <TrendingUp className="w-5 h-5" /> Weight Progress Trend
                  </h3>
                </div>
                <div className="h-[280px] w-full min-w-0">
                  {measurements.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={measurements.map(m => ({ name: m.month || m.week, weight: m.weight }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip trigger="click" contentStyle={{ backgroundColor: '#141414', border: '1px solid #333' }} />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#D4AF37' }} />
                        <Brush dataKey="name" height={30} stroke="#D4AF37" fill="#141414" travellerWidth={10} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center">
                      <TrendingUp className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-white/20 uppercase tracking-widest text-[9px] font-mono">No weight records found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Past vs Current Comparison */}
              <div className="p-6 md:p-8 rounded-3xl bg-brand-darkgrey/30 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-display font-bold text-brand-yellow">Key Metric Comparison</h3>
                  <div className="flex gap-3 text-[9px] uppercase tracking-widest font-mono">
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-white/20 rounded-full" /> Initial</span>
                    <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-brand-yellow rounded-full" /> Current</span>
                  </div>
                </div>
                <div className="h-[280px] w-full min-w-0">
                  {measurements.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Weight (kg)', Initial: measurements[0].weight, Current: measurements[measurements.length - 1].weight },
                          ...(measurements[0].waist ? [{ name: 'Waist (cm)', Initial: measurements[0].waist || 0, Current: measurements[measurements.length - 1].waist || 0 }] : []),
                          ...(measurements[0].chest ? [{ name: 'Chest (cm)', Initial: measurements[0].chest || 0, Current: measurements[measurements.length - 1].chest || 0 }] : []),
                          ...(measurements[0].hip ? [{ name: 'Hip (cm)', Initial: measurements[0].hip || 0, Current: measurements[measurements.length - 1].hip || 0 }] : []),
                          ...(measurements[0].thighs ? [{ name: 'Thighs (cm)', Initial: measurements[0].thighs || 0, Current: measurements[measurements.length - 1].thighs || 0 }] : []),
                          ...(measurements[0].arms ? [{ name: 'Arms (cm)', Initial: measurements[0].arms || 0, Current: measurements[measurements.length - 1].arms || 0 }] : []),
                          ...(measurements[0].calves ? [{ name: 'Calves (cm)', Initial: measurements[0].calves || 0, Current: measurements[measurements.length - 1].calves || 0 }] : []),
                          ...(measurements[0].lower_belly ? [{ name: 'L. Belly (cm)', Initial: measurements[0].lower_belly || 0, Current: measurements[measurements.length - 1].lower_belly || 0 }] : []),
                        ]}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#666" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#666" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '12px' }}
                          itemStyle={{ color: '#D4AF37' }}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar dataKey="Initial" fill="#333" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Current" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center">
                      <TrendingUp className="w-10 h-10 text-white/10 mx-auto mb-3" />
                      <p className="text-white/20 uppercase tracking-widest text-[9px] font-mono">No metric records found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Insights Bar */}
            <div className="bg-brand-yellow text-brand-black p-6 rounded-3xl">
              <h3 className="text-lg font-display font-bold mb-4 uppercase tracking-wider">Transformation Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-dark/10">
                <div className="pt-2 md:pt-0 md:pl-2">
                  <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-black/60">Initial Weight</p>
                  <p className="text-xl md:text-2xl font-display font-bold mt-1">
                    {measurements.length > 0 ? `${measurements[0].weight} kg` : '0.0 kg'}
                  </p>
                </div>
                <div className="pt-2 md:pt-0 md:pl-4">
                  <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-black/60">Current Weight</p>
                  <p className="text-xl md:text-2xl font-display font-bold mt-1">
                    {measurements.length > 0 ? `${measurements[measurements.length - 1].weight} kg` : '0.0 kg'}
                  </p>
                </div>
                <div className="pt-2 md:pt-0 md:pl-4">
                  <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-black/60">Total Difference</p>
                  <p className="text-xl md:text-2xl font-display font-bold mt-1">
                    {measurements.length > 1 
                      ? `${(measurements[0].weight - measurements[measurements.length - 1].weight).toFixed(1)} kg` 
                      : '0.0 kg'}
                  </p>
                </div>
                <div className="pt-2 md:pt-0 md:pl-4">
                  <p className="text-[9px] uppercase tracking-widest font-mono font-bold text-brand-black/60">Waist Change</p>
                  <p className="text-xl md:text-2xl font-display font-bold mt-1">
                    {measurements.length > 1 && measurements[0].waist && measurements[measurements.length - 1].waist
                      ? `${(measurements[0].waist - measurements[measurements.length - 1].waist).toFixed(1)} cm` 
                      : '0.0 cm'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Measurement */}
              <div className="p-6 md:p-8 rounded-3xl bg-brand-darkgrey/30 border border-white/5">
                <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-brand-yellow">
                  <Plus className="w-5 h-5" /> Log New Measurements
                </h3>
                <form onSubmit={handleAddMeasurement} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Month Period</label>
                      <select
                        required
                        value={newMeasurement.month || ''}
                        onChange={e => setNewMeasurement({ ...newMeasurement, month: e.target.value })}
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2.5 outline-none focus:border-brand-yellow/50 text-xs text-white"
                      >
                        <option value="" disabled>Select</option>
                        <option value="Jan 2026">Jan 2026</option>
                        <option value="Feb 2026">Feb 2026</option>
                        <option value="Mar 2026">Mar 2026</option>
                        <option value="Apr 2026">Apr 2026</option>
                        <option value="May 2026">May 2026</option>
                        <option value="Jun 2026">Jun 2026</option>
                        <option value="Jul 2026">Jul 2026</option>
                        <option value="Aug 2026">Aug 2026</option>
                        <option value="Sep 2026">Sep 2026</option>
                        <option value="Oct 2026">Oct 2026</option>
                        <option value="Nov 2026">Nov 2026</option>
                        <option value="Dec 2026">Dec 2026</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Weight (kg)</label>
                      <input 
                        type="number" step="0.1" required
                        value={newMeasurement.weight}
                        onChange={e => setNewMeasurement({...newMeasurement, weight: e.target.value})}
                        placeholder="00.0"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Waist (cm)</label>
                      <input 
                        type="number" step="0.1"
                        value={newMeasurement.waist}
                        onChange={e => setNewMeasurement({...newMeasurement, waist: e.target.value})}
                        placeholder="Optional"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Chest (cm)</label>
                      <input 
                        type="number" step="0.1"
                        value={newMeasurement.chest}
                        onChange={e => setNewMeasurement({...newMeasurement, chest: e.target.value})}
                        placeholder="Optional"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Hip (cm)</label>
                      <input
                        type="number" step="0.1"
                        value={newMeasurement.hip || ''}
                        onChange={e => setNewMeasurement({ ...newMeasurement, hip: e.target.value })}
                        placeholder="Optional"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Thighs (cm)</label>
                      <input
                        type="number" step="0.1"
                        value={newMeasurement.thighs || ''}
                        onChange={e => setNewMeasurement({ ...newMeasurement, thighs: e.target.value })}
                        placeholder="Optional"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Arms (cm)</label>
                      <input
                        type="number" step="0.1"
                        value={newMeasurement.arms || ''}
                        onChange={e => setNewMeasurement({ ...newMeasurement, arms: e.target.value })}
                        placeholder="Optional"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Calves (cm)</label>
                      <input
                        type="number" step="0.1"
                        value={newMeasurement.calves || ''}
                        onChange={e => setNewMeasurement({ ...newMeasurement, calves: e.target.value })}
                        placeholder="Optional"
                        className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-widest text-white/40 font-mono">Lower Belly (cm)</label>
                    <input
                      type="number" step="0.1"
                      value={newMeasurement.lower_belly || ''}
                      onChange={e => setNewMeasurement({ ...newMeasurement, lower_belly: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-brand-black border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-brand-yellow/50 font-mono text-xs text-white"
                    />
                  </div>
                  <button type="submit" className="w-full py-3 bg-brand-yellow text-brand-black font-bold uppercase tracking-wider text-[11px] rounded-xl hover:bg-white transition-colors cursor-pointer">
                    Save Record
                  </button>
                </form>
              </div>

              {/* History List */}
              <div className="p-6 md:p-8 rounded-3xl bg-brand-darkgrey/30 border border-white/5 flex flex-col">
                <h3 className="text-lg font-display font-bold mb-6 flex items-center gap-2 text-brand-yellow">
                  <LineChartIcon className="w-5 h-5" /> Logged History
                </h3>
                <div className="space-y-3 overflow-y-auto max-h-[360px] flex-1 pr-1 custom-scrollbar">
                  {measurements.length === 0 && (
                    <p className="text-center py-10 text-white/20 uppercase tracking-widest text-xs font-mono">No records logged</p>
                  )}
                  {measurements.slice().reverse().map(m => (
                    <div key={m.id} className="flex items-start justify-between p-4 bg-brand-black/40 rounded-2xl border border-white/5 group transition-all hover:border-white/10">
                      <div className="flex flex-wrap gap-x-6 gap-y-2 flex-1">
                        <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Month</p>
                          <p className="text-sm text-brand-yellow font-bold font-mono">{m.month || m.week || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Weight</p>
                          <p className="text-sm font-bold font-mono">{m.weight} kg</p>
                        </div>
                        {m.waist && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Waist</p>
                          <p className="text-sm text-blue-400 font-mono">{m.waist} cm</p>
                        </div>}
                        {m.chest && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Chest</p>
                          <p className="text-sm text-purple-400 font-mono">{m.chest} cm</p>
                        </div>}
                        {m.hip && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Hip</p>
                          <p className="text-sm text-pink-400 font-mono">{m.hip} cm</p>
                        </div>}
                        {m.thighs && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Thighs</p>
                          <p className="text-sm text-orange-400 font-mono">{m.thighs} cm</p>
                        </div>}
                        {m.arms && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Arms</p>
                          <p className="text-sm text-green-400 font-mono">{m.arms} cm</p>
                        </div>}
                        {m.calves && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Calves</p>
                          <p className="text-sm text-teal-400 font-mono">{m.calves} cm</p>
                        </div>}
                        {m.lower_belly && <div>
                          <p className="text-[9px] text-white/40 uppercase font-mono tracking-wider">Lower Belly</p>
                          <p className="text-sm text-red-400 font-mono">{m.lower_belly} cm</p>
                        </div>}
                      </div>
                      <button 
                        onClick={() => handleDeleteMeasurement(m.id)}
                        className="p-2 text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 ml-2 shrink-0"
                        title="Delete log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

        ) : (
          /* ==================== ADMIN MAIN DASHBOARD OVERVIEW ==================== */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Dashboard Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-brand-darkgrey/30 border border-white/5 p-6 rounded-3xl">
              <div>
                <h2 className="text-3xl font-display font-bold text-white leading-tight">
                  Welcome back, <span className="text-brand-yellow">Admin</span>
                </h2>
                <p className="text-xs text-white/40 font-mono mt-1 uppercase tracking-widest">
                  Flexi Fitness Academy Transformation Dashboard
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-brand-black/40 border border-white/5 px-4 py-2 rounded-2xl w-fit">
                <Calendar className="w-4.5 h-4.5 text-brand-yellow" />
                <span className="text-xs font-mono text-white/80">{new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            {/* Quick Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button 
                onClick={() => setDashboardFilter(curr => curr === 'all' ? null : 'all')}
                className={`text-left p-5 rounded-2xl flex flex-col justify-between border cursor-pointer active:scale-[0.98] transition-all ${
                  dashboardFilter === 'all' 
                    ? 'bg-brand-yellow/15 border-brand-yellow shadow-lg shadow-brand-yellow/5 ring-1 ring-gold/30' 
                    : 'bg-brand-darkgrey/30 border-white/5 hover:border-brand-yellow/30 hover:bg-brand-darkgrey/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] uppercase tracking-widest text-white/45 font-mono font-bold">Total Members</span>
                  <Users className="w-4.5 h-4.5 text-brand-yellow" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-display font-bold text-white">{students.length}</p>
                  <p className="text-[9px] text-white/30 font-mono mt-1">Total registered profiles</p>
                </div>
              </button>

              <button 
                onClick={() => setDashboardFilter(curr => curr === 'active' ? null : 'active')}
                className={`text-left p-5 rounded-2xl flex flex-col justify-between border cursor-pointer active:scale-[0.98] transition-all ${
                  dashboardFilter === 'active' 
                    ? 'bg-green-500/15 border-green-500 shadow-lg shadow-green-500/5 ring-1 ring-green-500/30' 
                    : 'bg-brand-darkgrey/30 border-white/5 hover:border-green-500/30 hover:bg-brand-darkgrey/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] uppercase tracking-widest text-white/45 font-mono font-bold">Active Members</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-display font-bold text-green-400">{activeStudentsCount}</p>
                  <p className="text-[9px] text-white/30 font-mono mt-1">Membership active</p>
                </div>
              </button>

              <button 
                onClick={() => setDashboardFilter(curr => curr === 'expiring_soon' ? null : 'expiring_soon')}
                className={`text-left p-5 rounded-2xl flex flex-col justify-between border cursor-pointer active:scale-[0.98] transition-all ${
                  dashboardFilter === 'expiring_soon' 
                    ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/5 ring-1 ring-orange-500/30' 
                    : 'bg-brand-darkgrey/30 border-white/5 hover:border-orange-500/30 hover:bg-brand-darkgrey/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] uppercase tracking-widest text-white/45 font-mono font-bold">Expiring Soon</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-display font-bold text-orange-400">{expiringSoonCount}</p>
                  <p className="text-[9px] text-white/30 font-mono mt-1">Expires within 7 days</p>
                </div>
              </button>

              <button 
                onClick={() => setDashboardFilter(curr => curr === 'expired' ? null : 'expired')}
                className={`text-left p-5 rounded-2xl flex flex-col justify-between border cursor-pointer active:scale-[0.98] transition-all ${
                  dashboardFilter === 'expired' 
                    ? 'bg-red-500/15 border-red-500 shadow-lg shadow-red-500/5 ring-1 ring-red-500/30' 
                    : 'bg-brand-darkgrey/30 border-white/5 hover:border-red-500/30 hover:bg-brand-darkgrey/50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] uppercase tracking-widest text-white/45 font-mono font-bold">Expired Accounts</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-display font-bold text-red-400">{expiredStudentsCount}</p>
                  <p className="text-[9px] text-white/30 font-mono mt-1">Membership expired</p>
                </div>
              </button>
            </div>

            {/* Monthly Revenue Section Card */}
            <div className="bg-gradient-to-br from-brand-yellow/15 to-surface/20 border border-brand-yellow/20 p-6 md:p-8 rounded-3xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-brand-yellow">
                    <Wallet className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-widest font-mono font-bold">Total Estimated Monthly Revenue</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">
                    ₹{totalMonthlyRevenue.toLocaleString('en-IN')}
                    <span className="text-sm font-sans font-normal text-white/50 ml-1">/ month</span>
                  </h3>
                  <p className="text-xs text-white/40 font-mono mt-2">
                    Based on monthly-equivalent price breakdown from {activeStudents.length} active memberships.
                  </p>
                </div>

                {/* Micro metrics */}
                <div className="grid grid-cols-2 gap-4 bg-brand-black/50 border border-white/5 p-4 rounded-2xl self-stretch md:self-auto flex-shrink-0">
                  <div className="px-2">
                    <span className="text-[9px] text-white/40 uppercase font-mono block">Paying Members</span>
                    <span className="text-xl font-display font-bold text-brand-yellow">{activeStudents.length}</span>
                  </div>
                  <div className="px-2 border-l border-white/10">
                    <span className="text-[9px] text-white/40 uppercase font-mono block">Avg. Ticket / Mo</span>
                    <span className="text-xl font-display font-bold text-white">
                      ₹{activeStudents.length > 0 ? Math.round(totalMonthlyRevenue / activeStudents.length).toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Package detailed revenue contributions */}
              <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {['1 month', '3 months', '6 months', '1 year', 'personal training'].map((pkgName) => {
                  const stat = packageStats[pkgName] || { count: 0, activeCount: 0, revenueContribution: 0 };
                  const priceInfo = getPackagePriceInfo(pkgName);
                  
                  return (
                    <div key={pkgName} className="bg-brand-black/20 border border-white/5 p-4 rounded-2xl">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-brand-yellow font-bold">{pkgName}</p>
                      <p className="text-[9px] font-mono text-white/30 mt-0.5">₹{priceInfo.total.toLocaleString('en-IN')} ({priceInfo.duration}m)</p>
                      
                      <div className="mt-3 flex justify-between items-baseline">
                        <div>
                          <span className="text-lg font-display font-bold">{stat.activeCount}</span>
                          <span className="text-[9px] font-mono text-white/40 ml-1">active</span>
                        </div>
                        <p className="text-xs font-mono font-bold text-white/80">₹{stat.revenueContribution.toLocaleString('en-IN')}/mo</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Personal Training Price Editor */}
              <div className="mt-6 pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-brand-black/20 border border-white/5 p-4 rounded-2xl">
                <div>
                  <p className="text-[10px] uppercase font-mono tracking-wider text-brand-yellow font-bold">Personal Training Price</p>
                  <p className="text-[9px] font-mono text-white/40 mt-0.5">Current: ₹{personalTrainingPrice.toLocaleString('en-IN')} / session</p>
                </div>
                {editingPTPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-sm font-mono">₹</span>
                    <input
                      type="number"
                      value={ptPriceInput}
                      onChange={e => setPtPriceInput(e.target.value)}
                      className="w-28 bg-brand-black border border-brand-yellow/50 rounded-xl px-3 py-2 text-sm font-mono text-white outline-none"
                      autoFocus
                    />
                    <button onClick={handleUpdatePTPrice}
                      className="px-4 py-2 bg-brand-yellow text-brand-black text-xs font-bold uppercase rounded-xl hover:bg-white transition-all">
                      Save
                    </button>
                    <button onClick={() => { setEditingPTPrice(false); setPtPriceInput(String(personalTrainingPrice)); }}
                      className="px-4 py-2 bg-white/5 text-white/60 text-xs font-bold uppercase rounded-xl hover:bg-white/10 transition-all">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setEditingPTPrice(true)}
                    className="px-4 py-2 bg-white/5 hover:bg-brand-yellow hover:text-brand-black border border-white/10 rounded-xl text-xs uppercase font-bold tracking-wider transition-all">
                    Edit Price
                  </button>
                )}
              </div>
            </div>

            {/* Search and Main Table List */}
            <div ref={listRef} className="bg-brand-darkgrey/30 border border-white/5 p-6 rounded-3xl scroll-mt-24">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    {dashboardFilter === 'all' && 'All Registered Members'}
                    {dashboardFilter === 'active' && 'Active Members'}
                    {dashboardFilter === 'expiring_soon' && 'Members Expiring Soon'}
                    {dashboardFilter === 'expired' && 'Expired Memberships'}
                    {dashboardFilter === null && 'Search Members'}
                  </h3>
                  <p className="text-xs text-white/45 font-mono uppercase mt-0.5">
                    {dashboardFilter 
                      ? `Category: ${dashboardFilter.replace('_', ' ')} (${filteredStudents.length} listed)` 
                      : searchQuery 
                        ? `Search Results (${filteredStudents.length} found)` 
                        : 'Select a category above or search to load'
                    }
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  {dashboardFilter !== null && (
                    <button 
                      onClick={() => setDashboardFilter(null)}
                      className="text-[10px] text-brand-yellow hover:text-white font-mono px-3 py-1.5 border border-brand-yellow/20 rounded-xl hover:bg-brand-yellow/5 transition-all"
                    >
                      Clear Filter
                    </button>
                  )}
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-64">
                    <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-brand-black/60 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs placeholder:text-white/20 text-white outline-none focus:border-brand-yellow/50 focus:ring-1 focus:ring-gold/20 transition-all font-mono"
                    />
                    {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Responsive Cards / List layout for student data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardFilter === null && searchQuery === '' ? (
                  <div className="col-span-full text-center py-10 text-white/25 font-mono text-xs border border-dashed border-white/5 rounded-2xl bg-brand-black/10">
                    <Search className="w-8 h-8 text-white/10 mx-auto mb-3" />
                    <p className="uppercase tracking-widest text-[9px] text-white/30">No Filter Active</p>
                    <p className="text-white/40 mt-1 max-w-xs mx-auto">Click on any stat card above (Active, Expiring Soon, Expired) or search to view members list.</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-white/20 font-mono text-xs border border-dashed border-white/5 rounded-2xl">
                    No matching students found.
                  </div>
                ) : (
                  filteredStudents.map(student => {
                    const status = getMembershipStatus(student.expiry_date);
                    
                    return (
                      <div 
                        key={student.id} 
                        className="bg-brand-black/30 border border-white/5 hover:border-white/10 p-5 rounded-2xl flex flex-col justify-between gap-4 transition-all group"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="text-base font-bold font-sans text-white group-hover:text-brand-yellow transition-colors">{student.name}</h4>
                            <p className="text-xs text-white/40 font-mono mt-0.5 truncate">{student.id}</p>
                          </div>

                          <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-bold ${
                            status === 'expired' 
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                              : status === 'expiring_soon'
                                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                : 'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              status === 'expired' ? 'bg-red-500' : status === 'expiring_soon' ? 'bg-orange-500' : 'bg-green-500'
                            }`} />
                            {status === 'expired' ? 'Expired' : status === 'expiring_soon' ? 'Expiring Soon' : 'Active'}
                          </div>
                        </div>

                        {/* Package Info Row */}
                        <div className="grid grid-cols-2 gap-2 bg-brand-darkgrey/40 p-3 rounded-xl border border-white/5 text-[10px] font-mono">
                          <div>
                            <span className="text-white/30 uppercase block">Plan selected</span>
                            <span className="text-brand-yellow font-bold">{student.package || 'None'}</span>
                          </div>
                          <div>
                            <span className="text-white/30 uppercase block">Expires on</span>
                            <span className="text-white/80">{student.expiry_date || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Actions Row */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setSelectedStudent(student); }}
                            className="flex-1 py-2.5 bg-white/5 hover:bg-brand-yellow hover:text-brand-black rounded-xl text-xs uppercase font-bold tracking-wider transition-all font-mono text-center flex items-center justify-center gap-1.5"
                          >
                            <span>Manage Student</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenewingStudent(student);
                            }}
                            className="px-4 py-2.5 bg-brand-yellow text-brand-black hover:bg-white rounded-xl text-xs uppercase font-bold tracking-wider transition-all font-mono text-center flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Renew Plan</span>
                          </button>

                          {student.whatsapp_no && (
                            <button
                              onClick={() => {
                                const message = `Hello ${student.name}, hope your workouts are going well! This is Flexi Fitness Academy checking in. Let us know if you need to review your transformation charts!`;
                                window.open(`https://wa.me/${student.whatsapp_no.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                              }}
                              className="p-2.5 bg-green-500/10 border border-green-500/25 hover:bg-green-500 hover:text-white rounded-xl text-green-400 transition-all"
                              title="Send WhatsApp Message"
                            >
                              <MessageCircle className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Monthly Revenue Trend Visualizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-brand-darkgrey/30 border border-white/5 p-6 rounded-3xl">
                <h3 className="text-lg font-display font-bold text-brand-yellow mb-4">Monthly Revenue Trend</h3>
                <div className="h-[250px] w-full min-w-0">
                  {revenueTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={revenueTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} formatter={(tick) => `₹${tick}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#141414', border: '1px solid #333' }}
                          formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Legend verticalAlign="top" height={36} />
                        <Line type="monotone" dataKey="Revenue" name="Revenue (₹)" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4, fill: '#D4AF37' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-white/20 text-xs font-mono text-center py-10">No revenue data logged</p>
                  )}
                </div>
              </div>

              {/* Quick instructions / Help board */}
              <div className="bg-brand-darkgrey/30 border border-white/5 p-6 rounded-3xl flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-display font-bold flex items-center gap-2 text-brand-yellow">
                    <HelpCircle className="w-5 h-5" /> Admin Quick Guide
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-xs text-white/50 font-mono">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
                      <span>Use the sidebar search or dashboard search to quickly locate any student by name or email.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
                      <span>Clicking <strong>Manage Student</strong> on any student shows their weight history and waist/chest transformation charts.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
                      <span>The monthly revenue estimates the run-rate from active subscriptions based on package types.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow mt-1.5 flex-shrink-0" />
                      <span>Click the <strong>WhatsApp</strong> button next to a student to quickly send them a renewal or check-in alert.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-[10px] text-white/30 font-mono">
                  <span>SYSTEM VERSION: v2.1</span>
                  <span>STATUS: SECURE SQLITE</span>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </main>
    </div>
  );
}


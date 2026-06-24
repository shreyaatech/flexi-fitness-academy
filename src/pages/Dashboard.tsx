/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  Settings, 
  LogOut, 
  Bell,
  Search,
  ChevronRight,
  Play,
  Clock,
  Flame,
  Loader2,
  X,
  Plus,
  MessageSquare
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
  ResponsiveContainer,
  Brush
} from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [performanceDataMonthly, setPerformanceDataMonthly] = useState<any[]>([]);
  const [nutritionHistory, setNutritionHistory] = useState<any[]>([]);
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [nutrition, setNutrition] = useState({ calories: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analyticsView, setAnalyticsView] = useState<'weekly' | 'monthly'>('weekly');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Modals (coach only — measurements/nutrition are admin-managed)
  const [activeModal, setActiveModal] = useState<'coach' | null>(null);
  

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    fetchData(parsedUser.id);
  }, []);

  const fetchData = async (studentId: string) => {
    try {
      setFetchError(false);
      const encodedId = encodeURIComponent(studentId);
      const [profileRes, measureRes, measureMonthlyRes, nutritionRes, nutritionHistoryRes, workoutsRes] = await Promise.all([
        fetch(`/api/student/profile/${encodedId}`),
        fetch(`/api/student/measurements/${encodedId}`),
        fetch(`/api/student/measurements-monthly/${encodedId}`),
        fetch(`/api/student/nutrition/${encodedId}`),
        fetch(`/api/student/nutrition-history/${encodedId}`),
        fetch('/api/workouts')
      ]);
      
      if (!profileRes.ok || !measureRes.ok || !measureMonthlyRes.ok || !nutritionRes.ok || !nutritionHistoryRes.ok || !workoutsRes.ok) {
        throw new Error('One or more requests failed');
      }

      const [profileData, measureData, measureMonthlyData, nutritionData, nutritionHistoryData, workoutsData] = await Promise.all([
        profileRes.json(),
        measureRes.json(),
        measureMonthlyRes.json(),
        nutritionRes.json(),
        nutritionHistoryRes.json(),
        workoutsRes.json()
      ]);
      
      setUser(profileData);
      setPerformanceData(measureData);
      setPerformanceDataMonthly(measureMonthlyData);
      setNutrition(nutritionData);
      setNutritionHistory(nutritionHistoryData);
      setWorkouts(workoutsData);

      // Check for expiry notifications
      if (profileData.expiry_date) {
        const expiry = new Date(profileData.expiry_date);
        const today = new Date();
        // Reset hours to compare dates only
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const newNotifications = [];
        if (diffDays <= 5 && diffDays >= 0) {
          newNotifications.push({
            id: 'expiry',
            title: 'Package Expiring Soon',
            message: diffDays === 0 
              ? 'Your package expires today! Please renew to continue.' 
              : `Your package will expire in ${diffDays} day${diffDays === 1 ? '' : 's'}. Please renew to continue your journey.`,
            type: 'warning',
            date: new Date().toISOString()
          });
        } else if (diffDays < 0) {
          newNotifications.push({
            id: 'expired',
            title: 'Package Expired',
            message: `Your package has expired. Please renew to regain access to all features.`,
            type: 'error',
            date: new Date().toISOString()
          });
        }
        setNotifications(newNotifications);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setFetchError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const filteredWorkouts = workouts.filter(w => 
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) return <div className="min-h-screen bg-brand-black flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-yellow" /></div>;

  if (fetchError) return (
    <div className="min-h-screen bg-brand-black flex flex-col items-center justify-center gap-6 text-white">
      <p className="text-white/60 uppercase tracking-widest text-sm">Failed to load your data.</p>
      <button
        onClick={() => { if (user?.id) { setIsLoading(true); fetchData(user.id); } }}
        className="px-6 py-3 bg-brand-yellow text-brand-black font-bold uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-black flex flex-col md:flex-row">
      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex w-20 lg:w-64 border-r border-white/5 flex-col shrink-0">
        <div className="p-6 mb-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Flexi Academy"
              className="w-10 h-10 rounded-full object-cover flex-shrink-0 ring-2 ring-gold/30"
            />
            <span className="hidden lg:block text-lg font-display font-bold tracking-widest uppercase">
              Flexi <span className="text-brand-yellow">Academy</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem 
            icon={<Calendar />} 
            label="Schedule" 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')}
          />
          <SidebarItem 
            icon={<TrendingUp />} 
            label="Analytics" 
            active={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')}
          />
          <SidebarItem 
            icon={<Settings />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="p-4 border-t border-white/5">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 text-white/40 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all"
          >
            <LogOut className="w-6 h-6" />
            <span className="hidden lg:block font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Bottom Navigation (Mobile/PWA only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-black/95 backdrop-blur-lg border-t border-white/5 flex justify-around py-2 px-2 z-45 shadow-2xl">
        <TabItem 
          icon={<LayoutDashboard />} 
          label="Home" 
          active={activeTab === 'dashboard'} 
          onClick={() => setActiveTab('dashboard')}
        />
        <TabItem 
          icon={<Calendar />} 
          label="Schedule" 
          active={activeTab === 'schedule'} 
          onClick={() => setActiveTab('schedule')}
        />
        <TabItem 
          icon={<TrendingUp />} 
          label="Analytics" 
          active={activeTab === 'analytics'} 
          onClick={() => setActiveTab('analytics')}
        />
        <TabItem 
          icon={<Settings />} 
          label="Settings" 
          active={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')}
        />
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {/* Top Bar */}
        <header className="h-16 md:h-20 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 bg-brand-black/80 backdrop-blur-md z-30">
          {/* Brand/Logo for Mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/logo.png"
              alt="Flexi Academy"
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
            <span className="text-sm font-display font-bold tracking-widest uppercase">
              Flexi <span className="text-brand-yellow">Academy</span>
            </span>
          </div>

          <div className="relative hidden md:block w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <input 
              type="text" 
              placeholder="Search workouts, types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-darkgrey/50 border border-white/5 rounded-full py-2 pl-12 pr-4 text-sm focus:border-brand-yellow/30 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center transition-colors ${showNotifications ? 'text-brand-yellow' : 'text-white/40 hover:text-white'}`}
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-dark animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-72 sm:w-80 bg-brand-darkgrey border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                      <h4 className="text-xs sm:text-sm font-bold uppercase tracking-widest">Notifications</h4>
                      {notifications.length > 0 && (
                        <span className="text-[9px] sm:text-[10px] bg-brand-yellow/20 text-brand-yellow px-2 py-0.5 rounded-full font-bold">
                          {notifications.length} NEW
                        </span>
                      )}
                    </div>
                    <div className="max-h-[350px] sm:max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                          <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-white/10 mx-auto mb-3" />
                          <p className="text-xs text-white/40">No new notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.map((notification) => (
                            <div key={notification.id} className="p-3 sm:p-4 hover:bg-white/5 transition-colors group">
                              <div className="flex gap-2.5 sm:gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                  notification.type === 'error' ? 'bg-red-500' : 
                                  notification.type === 'warning' ? 'bg-brand-yellow' : 'bg-blue-500'
                                }`} />
                                <div>
                                  <p className="text-xs sm:text-sm font-bold mb-1 group-hover:text-brand-yellow transition-colors">{notification.title}</p>
                                  <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed mb-2">{notification.message}</p>
                                  <p className="text-[9px] sm:text-[10px] text-white/20 uppercase tracking-widest">
                                    {new Date(notification.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 pl-4 sm:pl-6 border-l border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name || 'Student'}</p>
                <p className="text-[10px] text-brand-yellow uppercase tracking-widest">Elite Member</p>
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-brand-yellow to-dark p-0.5">
                <div className="w-full h-full rounded-full bg-brand-black flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold">{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'ST'}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="xl:col-span-2 space-y-8">
                {/* Welcome Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-yellow text-brand-black overflow-hidden"
                >
                  <div className="relative z-10">
                    <h2 className="text-2xl sm:text-4xl font-display mb-2">Welcome back, {user?.name || 'Student'}!</h2>
                    <p className="text-brand-black/65 text-xs sm:text-sm mb-6 sm:mb-8 max-w-md">You've completed 85% of your monthly goal. Keep pushing for that 100%!</p>
                    <div className="inline-flex items-center gap-2 px-5 py-3 bg-brand-black/20 rounded-xl text-brand-black/70 text-xs uppercase tracking-widest font-bold border border-brand-black/10">
                      <span>📊</span> Progress updated by your coach
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-10 hidden sm:block">
                    <Flame className="w-48 h-48" />
                  </div>
                </motion.div>

                {/* Monthly Analytics Summary */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-display">Monthly Analytics</h3>
                    <button
                      onClick={() => setActiveTab('analytics')}
                      className="text-xs text-brand-yellow uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Full View
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-brand-black/50 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Total Loss</p>
                      <p className="text-xl sm:text-2xl font-display text-brand-yellow">
                        {performanceData.length > 1 
                          ? (performanceData[0].value - performanceData[performanceData.length - 1].value).toFixed(1) 
                          : '0.0'} kg
                      </p>
                    </div>
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-brand-black/50 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Avg. Monthly</p>
                      <p className="text-xl sm:text-2xl font-display text-brand-yellow">
                        {performanceData.length > 1 
                          ? ((performanceData[0].value - performanceData[performanceData.length - 1].value) / (performanceData.length - 1)).toFixed(1) 
                          : '0.0'} kg
                      </p>
                    </div>
                    <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-brand-black/50 border border-white/5">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">Current Weight</p>
                      <p className="text-xl sm:text-2xl font-display text-brand-yellow">
                        {performanceData.length > 0 ? performanceData[performanceData.length - 1].value : '0.0'} kg
                      </p>
                    </div>
                  </div>

                  {/* Weight-over-months Line Graph */}
                  <div className="h-[260px] w-full min-w-0">
                    {performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#555"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis
                            stroke="#555"
                            fontSize={10}
                            axisLine={false}
                            tickLine={false}
                            domain={['auto', 'auto']}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '12px' }}
                            itemStyle={{ color: '#D4AF37' }}
                            formatter={(v: any) => [`${v} kg`, 'Weight']}
                          />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#D4AF37"
                            strokeWidth={0}
                            fill="url(#weightGradient)"
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            name="Weight (kg)"
                            stroke="#D4AF37"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }}
                            activeDot={{ r: 6, fill: '#D4AF37' }}
                          />
                          <Brush
                            dataKey="name"
                            height={20}
                            stroke="#D4AF37"
                            fill="#141414"
                            travellerWidth={6}
                            tickFormatter={() => ''}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <TrendingUp className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/20 uppercase tracking-widest text-[10px]">Your coach will add your progress here</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <StatCard icon={<Flame className="text-orange-400" />} label="Daily Calories" value={nutrition.calories.toString()} unit="kcal" />
                  <StatCard icon={<Clock className="text-blue-400" />} label="Training Time" value="4.5" unit="hrs" />
                </div>

                {/* Upcoming Sessions */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg sm:text-xl font-display">Workouts</h3>
                    <button className="text-xs text-brand-yellow uppercase tracking-widest hover:text-white transition-colors">View All</button>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredWorkouts.length === 0 && (
                      <p className="text-center py-10 text-white/20 uppercase tracking-widest text-xs">No workouts found</p>
                    )}
                    {filteredWorkouts.map((session) => (
                      <div key={session.id} className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-brand-black/50 border border-white/5 flex items-center justify-between group hover:border-brand-yellow/30 transition-all cursor-pointer">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-yellow/10 flex items-center justify-center text-brand-yellow group-hover:bg-brand-yellow group-hover:text-brand-black transition-all">
                            <Play className="w-3.5 h-3.5 fill-current" />
                          </div>
                          <div>
                            <p className="text-xs sm:text-sm font-medium">{session.title}</p>
                            <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest">{session.time} • {session.duration}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-brand-yellow transition-colors" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-brand-yellow/10 to-transparent border border-brand-yellow/10">
                  <h3 className="text-lg sm:text-xl font-display mb-4">Quick Actions</h3>
                  <div className="space-y-2.5 sm:space-y-3">
                    {/* Info banner — data is admin-managed */}
                    <div className="w-full py-3 px-4 bg-brand-yellow/5 border border-brand-yellow/15 rounded-xl text-xs text-white/50 leading-relaxed">
                      <span className="text-brand-yellow font-bold uppercase tracking-widest block mb-1">📋 Coach-Managed Data</span>
                      Your measurements &amp; nutrition are tracked and updated by your coach.
                    </div>
                    <button 
                      onClick={() => setActiveModal('coach')}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs uppercase tracking-widest transition-all text-left px-4 flex items-center justify-between"
                    >
                      Contact Coach <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-display">Deep Analytics</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Measurement Progress */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-display">Monthly Measurement Progress</h3>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-yellow" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">Weight</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">Waist</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                        <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-white/40">Chest</span>
                      </div>
                    </div>
                  </div>
                  <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                    {performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#666" 
                            fontSize={10} 
                            axisLine={false} 
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis 
                            stroke="#666" 
                            fontSize={10} 
                            axisLine={false} 
                            tickLine={false}
                          />
                          <Tooltip 
                            trigger="click"
                            contentStyle={{ backgroundColor: '#141414', border: '1px solid #333', borderRadius: '12px' }}
                            itemStyle={{ color: '#D4AF37' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            name="Weight (kg)"
                            stroke="#D4AF37" 
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#D4AF37' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="waist" 
                            name="Waist (cm)"
                            stroke="#60A5FA" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#60A5FA' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="chest" 
                            name="Chest (cm)"
                            stroke="#C084FC" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#C084FC' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="hip" 
                            name="Hip (cm)" 
                            stroke="#FF5733" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#FF5733' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="thighs" 
                            name="Thighs (cm)" 
                            stroke="#FFBD33" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#FFBD33' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="arms" 
                            name="Arms (cm)" 
                            stroke="#75FF33" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#75FF33' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="calves" 
                            name="Calves (cm)" 
                            stroke="#33FFBD" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#33FFBD' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="lower_belly" 
                            name="Lower Belly (cm)" 
                            stroke="#3375FF" 
                            strokeWidth={2}
                            dot={{ r: 3, fill: '#3375FF' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full w-full flex flex-col items-center justify-center text-center">
                        <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/20 uppercase tracking-widest text-[10px]">No measurement data yet</p>
                        <p className="mt-2 text-white/20 text-[10px]">Your coach will add your progress here</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Past vs Current Comparison */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                    <h3 className="text-lg sm:text-xl font-display">Transformation Comparison</h3>
                    <div className="flex gap-3 text-[9px] sm:text-[10px] uppercase tracking-widest">
                      <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-white/20 rounded-full" /> Initial</span>
                      <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 bg-brand-yellow rounded-full" /> Current</span>
                    </div>
                  </div>
                  <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                    {performanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'Weight (kg)', Initial: performanceData[0].value, Current: performanceData[performanceData.length - 1].value },
                            ...(performanceData[0].waist ? [{ name: 'Waist (cm)', Initial: performanceData[0].waist || 0, Current: performanceData[performanceData.length - 1].waist || 0 }] : []),
                            ...(performanceData[0].chest ? [{ name: 'Chest (cm)', Initial: performanceData[0].chest || 0, Current: performanceData[performanceData.length - 1].chest || 0 }] : []),
                            ...(performanceData[0].hip ? [{ name: 'Hip (cm)', Initial: performanceData[0].hip || 0, Current: performanceData[performanceData.length - 1].hip || 0 }] : []),
                            ...(performanceData[0].thighs ? [{ name: 'Thighs (cm)', Initial: performanceData[0].thighs || 0, Current: performanceData[performanceData.length - 1].thighs || 0 }] : []),
                            ...(performanceData[0].arms ? [{ name: 'Arms (cm)', Initial: performanceData[0].arms || 0, Current: performanceData[performanceData.length - 1].arms || 0 }] : []),
                            ...(performanceData[0].calves ? [{ name: 'Calves (cm)', Initial: performanceData[0].calves || 0, Current: performanceData[performanceData.length - 1].calves || 0 }] : []),
                            ...(performanceData[0].lower_belly ? [{ name: 'L.Belly (cm)', Initial: performanceData[0].lower_belly || 0, Current: performanceData[performanceData.length - 1].lower_belly || 0 }] : []),
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
                      <div className="text-center h-full flex flex-col items-center justify-center">
                        <TrendingUp className="w-12 h-12 text-white/10 mx-auto mb-4" />
                        <p className="text-white/20 uppercase tracking-widest text-[10px]">No measurement data logged yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calorie Intake */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <h3 className="text-lg sm:text-xl font-display mb-6 sm:mb-8">Calorie Intake History</h3>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={nutritionHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                        <XAxis dataKey="name" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#141414', border: '1px solid #333' }} />
                        <Bar dataKey="value" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Workout Distribution */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <h3 className="text-lg sm:text-xl font-display mb-6 sm:mb-8">Workout Distribution</h3>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 h-auto sm:h-[300px]">
                    <div className="w-full sm:w-1/2 h-[200px] sm:h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Strength', value: 40 },
                              { name: 'Cardio', value: 30 },
                              { name: 'Yoga', value: 20 },
                              { name: 'HIIT', value: 10 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            <Cell fill="#D4AF37" />
                            <Cell fill="#8E9299" />
                            <Cell fill="#4A4A4A" />
                            <Cell fill="#1A1A1A" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex sm:flex-col flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-y-0 sm:space-y-2">
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#D4AF37] rounded-full" /><span className="text-[10px] uppercase tracking-widest text-white/60">Strength</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#8E9299] rounded-full" /><span className="text-[10px] uppercase tracking-widest text-white/60">Cardio</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#4A4A4A] rounded-full" /><span className="text-[10px] uppercase tracking-widest text-white/60">Yoga</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#1A1A1A] rounded-full" /><span className="text-[10px] uppercase tracking-widest text-white/60">HIIT</span></div>
                    </div>
                  </div>
                </div>

                {/* Monthly Measurement History */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-darkgrey/30 border border-white/5">
                  <h3 className="text-lg sm:text-xl font-display mb-6 sm:mb-8">Monthly Measurement History</h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {performanceData.length === 0 && (
                      <p className="text-center py-10 text-white/20 uppercase tracking-widest text-xs">No records found</p>
                    )}
                    {performanceData.slice().reverse().map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-brand-black/50 rounded-xl border border-white/5">
                        <div>
                          <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{record.name}</p>
                          <div className="flex gap-4">
                            <div>
                              <p className="text-[10px] text-white/20 uppercase">Weight</p>
                              <p className="text-lg font-display text-brand-yellow">{record.value} kg</p>
                            </div>
                            {record.waist && (
                              <div>
                                <p className="text-[10px] text-white/20 uppercase">Waist</p>
                                <p className="text-lg font-display text-blue-400">{record.waist} cm</p>
                              </div>
                            )}
                            {record.chest && (
                              <div>
                                <p className="text-[10px] text-white/20 uppercase">Chest</p>
                                <p className="text-lg font-display text-purple-400">{record.chest} cm</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          {index < performanceData.length - 1 && (
                            <p className={`text-xs font-bold ${record.value < performanceData.slice().reverse()[index+1].value ? 'text-green-400' : 'text-red-400'}`}>
                              {record.value < performanceData.slice().reverse()[index+1].value ? '-' : '+'}
                              {Math.abs(record.value - performanceData.slice().reverse()[index+1].value).toFixed(1)} kg
                            </p>
                          )}
                          <p className="text-[10px] text-white/20 uppercase tracking-widest">Progress</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Insights */}
                <div className="p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-brand-yellow text-brand-black">
                  <h3 className="text-lg sm:text-xl font-display mb-6">Elite Insights</h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-dark/10 pb-4">
                      <span className="text-xs uppercase tracking-widest font-bold">Total Weight Loss</span>
                      <span className="text-2xl font-display">
                        {performanceData.length > 1 
                          ? (performanceData[0].value - performanceData[performanceData.length - 1].value).toFixed(1) 
                          : '0.0'} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dark/10 pb-4">
                      <span className="text-xs uppercase tracking-widest font-bold">Avg. Weekly Loss</span>
                      <span className="text-2xl font-display">
                        {performanceData.length > 1 
                          ? ((performanceData[0].value - performanceData[performanceData.length - 1].value) / (performanceData.length - 1)).toFixed(1) 
                          : '0.0'} kg
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-dark/10 pb-4">
                      <span className="text-xs uppercase tracking-widest font-bold">Consistency Score</span>
                      <span className="text-2xl font-display">
                        {Math.min(90 + performanceData.length, 99)}%
                      </span>
                    </div>
                    <button 
                      onClick={() => setActiveTab('dashboard')}
                      className="w-full py-4 bg-brand-black text-white rounded-xl text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6"
            >
              <div className="w-20 h-20 bg-brand-yellow/10 rounded-full flex items-center justify-center text-brand-yellow">
                {activeTab === 'schedule' && <Calendar className="w-10 h-10" />}
                {activeTab === 'settings' && <Settings className="w-10 h-10" />}
              </div>
              <div>
                <h2 className="text-3xl font-display capitalize">{activeTab}</h2>
                <p className="text-white/40 uppercase tracking-widest text-xs mt-2">This feature is coming soon to your elite portal</p>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="px-8 py-3 bg-brand-yellow text-brand-black rounded-xl text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </div>
      </main>

      {/* Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-brand-black/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-brand-darkgrey border border-white/10 rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {activeModal === 'coach' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display">Contact Coach</h3>
                      <p className="text-[10px] text-white/40 uppercase tracking-widest">Get expert guidance</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-brand-black border border-white/5">
                      <p className="text-sm text-white/60 mb-4">Your dedicated coach is available for 1-on-1 support.</p>
                      <div className="space-y-2">
                        <a href="tel:+918080332877" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-brand-yellow hover:text-brand-black transition-all group">
                          <span className="text-xs uppercase tracking-widest">Call Coach</span>
                          <ChevronRight className="w-4 h-4" />
                        </a>
                        <a href="https://wa.me/918080332877" target="_blank" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-green-500 hover:text-white transition-all group">
                          <span className="text-xs uppercase tracking-widest">WhatsApp</span>
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveModal(null)}
                    className="w-full py-4 border border-white/10 text-white/40 font-bold uppercase tracking-widest rounded-xl hover:text-white transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TabItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }}
      className={cn(
        "flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all text-center",
        active ? "text-brand-yellow" : "text-white/40"
      )}
    >
      <div className="w-5 h-5">
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
      }}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-2xl transition-all group relative z-50",
        active 
          ? "bg-brand-yellow text-brand-black" 
          : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn("w-6 h-6", active ? "text-brand-black" : "group-hover:text-brand-yellow transition-colors")}>
        {icon}
      </div>
      <span className="hidden lg:block font-medium">{label}</span>
    </button>
  );
}

function StatCard({ icon, label, value, unit }: { icon: React.ReactNode, label: string, value: string, unit: string }) {
  return (
    <div className="p-4 sm:p-6 rounded-3xl bg-brand-darkgrey/30 border border-white/5">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-display">{value}</span>
        <span className="text-[10px] text-white/20 uppercase">{unit}</span>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}


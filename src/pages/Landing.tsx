/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  Calendar, 
  LineChart, 
  Lock, 
  Users, 
  Instagram, 
  ChevronRight, 
  Menu, 
  X,
  Phone,
  Zap
} from 'lucide-react';
import { 
  LineChart as ReChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Link } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const chartData = [
  { name: 'Week 1', value: 65 },
  { name: 'Week 2', value: 63 },
  { name: 'Week 3', value: 61 },
  { name: 'Week 4', value: 59 },
  { name: 'Week 5', value: 58 },
  { name: 'Week 6', value: 56 },
];

const packages = [
  { name: '1 Month', desc: 'Kickstart your journey', price: '₹2,500', popular: false },
  { name: '3 Months', desc: 'Build consistency', price: '₹6,000', popular: true },
  { name: '6 Months', desc: 'Commit to change', price: '₹10,000', popular: false },
  { name: '1 Year', desc: 'Lifestyle mastery', price: '₹15,000', popular: false },
];

const curriculum = [
  { day: 'Monday', title: 'Upper Body', subtitle: 'Strength & Toning' },
  { day: 'Tuesday', title: 'Lower Body', subtitle: 'Glutes & Legs' },
  { day: 'Wednesday', title: 'ABS', subtitle: 'Core Stability' },
  { day: 'Thursday', title: 'Functional', subtitle: 'Full Body Mobility' },
  { day: 'Friday', title: 'Yoga', subtitle: 'Flexibility & Mind' },
  { day: 'Saturday', title: 'High Intense', subtitle: 'Fat Burn & Cardio' },
  { day: 'Sunday', title: 'Rest', subtitle: 'Recovery Day' },
];

const features = [
  {
    icon: <LineChart className="w-6 h-6" />,
    title: 'Smart Analytics',
    desc: 'Track every measurement and see your progress through bold interactive charts.'
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: 'Private Vault',
    desc: 'Secure PIN-based access ensures your personal transformation data stays private.'
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Elite Coaching',
    desc: 'Personalized attention and high-energy management for your fitness journey.'
  }
];

export default function Landing() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [ptPrice, setPtPrice] = useState(7000);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/settings/personal-training-price')
      .then(r => r.json())
      .then(d => setPtPrice(d.price))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-brand-black text-white selection:bg-brand-yellow/30 selection:text-brand-yellow">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b",
        isScrolled 
          ? "bg-brand-black/90 backdrop-blur-md border-white/10 py-4" 
          : "bg-transparent border-transparent py-6"
      )}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/logo.png"
                alt="Flexi Academy"
                className="w-12 h-12 rounded-full object-cover border-2 border-brand-yellow group-hover:scale-105 transition-transform"
              />
            </div>
            <span className="text-2xl font-display font-black tracking-tight uppercase">
              FLEXI<span className="text-brand-yellow">ACADEMY</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#packages" className="text-sm font-bold uppercase tracking-wider hover:text-brand-yellow transition-colors">Packages</a>
            <a href="#curriculum" className="text-sm font-bold uppercase tracking-wider hover:text-brand-yellow transition-colors">Curriculum</a>
            <a href="#features" className="text-sm font-bold uppercase tracking-wider hover:text-brand-yellow transition-colors">Features</a>
            <Link to="/login" className="px-6 py-2.5 bg-brand-yellow text-brand-black font-bold uppercase tracking-wider hover:bg-white transition-colors rounded-none skew-x-[-10deg]">
              <div className="skew-x-[10deg]">Member Login</div>
            </Link>
          </div>

          <button 
            className="md:hidden text-brand-yellow hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="fixed inset-0 z-40 bg-brand-black pt-24 px-6 md:hidden border-l-4 border-brand-yellow"
          >
            <div className="flex flex-col gap-8 text-left">
              <a href="#packages" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-display font-black uppercase text-white hover:text-brand-yellow transition-colors">Packages</a>
              <a href="#curriculum" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-display font-black uppercase text-white hover:text-brand-yellow transition-colors">Curriculum</a>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-4xl font-display font-black uppercase text-white hover:text-brand-yellow transition-colors">Features</a>
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="mt-8 py-5 bg-brand-yellow text-brand-black text-center text-xl font-black uppercase tracking-wider skew-x-[-10deg]">
                <div className="skew-x-[10deg]">Member Login</div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 pb-12 overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&q=80&w=2000" 
            alt="Fitness background"
            className="w-full h-full object-cover opacity-20 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-brand-black/80 to-transparent" />
          <div className="absolute top-1/4 -right-64 w-96 h-96 bg-brand-yellow/20 rounded-full blur-[128px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-darkgrey border-l-4 border-brand-yellow text-white text-xs font-bold uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-brand-yellow animate-pulse" />
              Elite Ladies Fitness
            </div>
            
            <h1 className="text-6xl sm:text-8xl md:text-9xl font-display font-black mb-6 leading-[0.9] uppercase tracking-tighter text-white">
              PUSH YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-600">
                LIMITS
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-xl font-medium leading-relaxed border-l-2 border-white/20 pl-6">
              Experience the pinnacle of high-energy fitness. A modern digital ecosystem designed exclusively for the strong woman.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Link to="/login" className="group relative px-8 py-4 bg-brand-yellow text-brand-black font-black text-lg uppercase tracking-wider overflow-hidden skew-x-[-10deg] hover:bg-white transition-colors">
                <div className="skew-x-[10deg] flex items-center gap-2">
                  Join The Academy <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
              <a href="#packages" className="flex items-center gap-2 text-white hover:text-brand-yellow transition-colors font-bold uppercase tracking-widest text-sm">
                View Packages
              </a>
            </div>
          </motion.div>
        </div>

        {/* Decorative bold text in background */}
        <div className="absolute -bottom-10 right-0 overflow-hidden pointer-events-none opacity-5">
          <span className="text-[20rem] font-display font-black text-white leading-none select-none">
            FLEXI
          </span>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-24 px-6 bg-brand-black relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="mb-16">
            <h2 className="text-4xl md:text-6xl font-display font-black uppercase text-white mb-4">TRAINING <span className="text-brand-yellow">PLANS</span></h2>
            <p className="text-white/50 font-bold uppercase tracking-widest text-sm">Select your transformation path</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className={cn(
                  "relative p-8 border-2 transition-all duration-300 group flex flex-col",
                  pkg.popular 
                    ? "bg-brand-yellow border-brand-yellow text-brand-black -translate-y-2 shadow-[8px_8px_0px_rgba(255,255,255,0.1)]" 
                    : "bg-brand-darkgrey border-white/10 text-white hover:border-brand-yellow hover:-translate-y-1 hover:shadow-[4px_4px_0px_rgba(255,234,0,0.5)]"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 right-4 bg-brand-black text-brand-yellow text-xs font-black px-3 py-1 uppercase tracking-widest skew-x-[-10deg]">
                    <div className="skew-x-[10deg]">Most Popular</div>
                  </div>
                )}
                <h3 className="text-2xl font-display font-black uppercase mb-2">{pkg.name}</h3>
                <p className={cn("text-sm font-medium mb-8", pkg.popular ? "text-brand-black/70" : "text-white/50")}>{pkg.desc}</p>
                <div className="mt-auto">
                  <div className="text-4xl font-display font-black tracking-tight mb-8">
                    {pkg.price}
                  </div>
                  <Link to="/login" className={cn(
                    "block w-full py-4 text-sm text-center uppercase tracking-widest font-black transition-all border-2",
                    pkg.popular 
                      ? "bg-brand-black text-brand-yellow border-brand-black hover:bg-white hover:text-brand-black hover:border-white" 
                      : "bg-transparent border-white/20 hover:border-brand-yellow hover:bg-brand-yellow hover:text-brand-black"
                  )}>
                    Select Plan
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Personal Training Callout */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-8 md:p-12 bg-brand-darkgrey border-l-8 border-brand-yellow flex flex-col md:flex-row items-center justify-between gap-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-brand-yellow text-brand-black rounded-sm">
                  <Dumbbell className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-display font-black uppercase">1-ON-1 COACHING</h3>
              </div>
              <p className="text-brand-yellow font-display text-2xl font-black mb-4">₹{ptPrice.toLocaleString('en-IN')} onwards</p>
              <p className="text-white/60 font-medium max-w-md">Customized elite coaching for maximum results. Tailored nutrition and intense workout plans. Price varies based on your goals and duration.</p>
            </div>
            <a 
              href="tel:+918080332877"
              className="flex items-center gap-3 px-8 py-5 bg-brand-yellow text-brand-black font-black uppercase tracking-widest hover:bg-white transition-colors skew-x-[-10deg]"
            >
              <div className="skew-x-[10deg] flex items-center gap-3">
                <Phone className="w-5 h-5" />
                <div className="text-left">
                  <div className="text-xs">Call Now</div>
                  <div className="text-sm tracking-normal normal-case font-bold">+91 80803 32877</div>
                </div>
              </div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Curriculum Section */}
      <section id="curriculum" className="py-24 px-6 bg-brand-darkgrey border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div>
              <h2 className="text-4xl md:text-6xl font-display font-black uppercase text-white mb-4">WEEKLY <span className="text-brand-yellow">ROUTINE</span></h2>
              <p className="text-white/50 font-bold uppercase tracking-widest text-sm">Engineered for peak performance</p>
            </div>
            <div className="flex items-center gap-3 text-brand-yellow font-bold text-sm uppercase tracking-widest bg-brand-yellow/10 px-4 py-2">
              <Calendar className="w-5 h-5" />
              Live Schedule
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {curriculum.map((item, idx) => (
              <motion.div
                key={item.day}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                className="group p-6 bg-brand-black border border-white/5 hover:border-brand-yellow transition-colors relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-brand-yellow scale-y-0 group-hover:scale-y-100 transition-transform origin-top" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-yellow mb-4 block">{item.day}</span>
                <h4 className="text-xl font-display font-bold uppercase mb-1 text-white">{item.title}</h4>
                <p className="text-xs text-white/50 font-medium">{item.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics & Features */}
      <section id="features" className="py-24 px-6 bg-brand-black">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-12">
              <div>
                <h2 className="text-4xl md:text-6xl font-display font-black uppercase mb-6 leading-tight">TRACK YOUR <br/><span className="text-brand-yellow">POWER</span></h2>
                <p className="text-white/60 text-lg font-medium leading-relaxed border-l-2 border-brand-yellow pl-4">
                  Data-driven gains. We provide a complete tech ecosystem to monitor every drop of sweat.
                </p>
              </div>

              <div className="space-y-8">
                {features.map((feature, idx) => (
                  <motion.div 
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-6 group"
                  >
                    <div className="flex-shrink-0 w-14 h-14 bg-brand-darkgrey border-2 border-white/10 group-hover:border-brand-yellow group-hover:bg-brand-yellow group-hover:text-brand-black flex items-center justify-center text-brand-yellow transition-all skew-x-[-10deg]">
                      <div className="skew-x-[10deg]">
                        {feature.icon}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xl font-display font-bold uppercase mb-2 group-hover:text-brand-yellow transition-colors">{feature.title}</h4>
                      <p className="text-sm text-white/50 font-medium leading-relaxed">{feature.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 bg-brand-darkgrey border-2 border-brand-yellow relative"
            >
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-brand-yellow border-4 border-brand-black rounded-full" />
              <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-white border-4 border-brand-black rounded-full" />
              
              <div className="flex items-center justify-between mb-8">
                <h4 className="font-display font-bold uppercase text-white/70">Performance Metrics</h4>
                <div className="flex items-center gap-2 px-3 py-1 bg-brand-black rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-[10px] text-white font-bold uppercase tracking-wider">Syncing</span>
                </div>
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ReChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#666" 
                      fontSize={12}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#666" 
                      fontSize={12}
                      fontWeight="bold"
                      tickLine={false} 
                      axisLine={false}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFEA00', border: 'none', borderRadius: '0', color: '#0A0A0A', fontWeight: 'bold' }}
                      itemStyle={{ color: '#0A0A0A' }}
                      cursor={{ stroke: '#FFEA00', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#FFEA00" 
                      strokeWidth={4} 
                      dot={{ fill: '#0A0A0A', stroke: '#FFEA00', strokeWidth: 2, r: 5 }}
                      activeDot={{ fill: '#FFEA00', stroke: '#0A0A0A', strokeWidth: 2, r: 8 }}
                    />
                  </ReChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                <div className="p-4 bg-brand-black border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Total</p>
                  <p className="text-2xl font-display font-black text-brand-yellow">-9.0<span className="text-sm">kg</span></p>
                </div>
                <div className="p-4 bg-brand-black border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Streak</p>
                  <p className="text-2xl font-display font-black text-brand-yellow">42<span className="text-sm">d</span></p>
                </div>
                <div className="p-4 bg-brand-black border border-white/5 text-center">
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Pace</p>
                  <p className="text-2xl font-display font-black text-brand-yellow">98<span className="text-sm">%</span></p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 bg-brand-yellow text-brand-black relative overflow-hidden">
        {/* Abstract background shapes */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-black/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/30 rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-6xl md:text-8xl font-display font-black uppercase mb-8 leading-none tracking-tighter">
              DOMINATE <br />YOUR GOALS
            </h2>
            <p className="text-brand-black/70 text-lg md:text-xl font-bold mb-12 max-w-2xl mx-auto">
              Join the elite circle. Stop wishing, start doing. Our program is built for those who demand excellence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/login" className="px-10 py-5 bg-brand-black text-white font-black uppercase tracking-widest text-lg hover:scale-105 transition-transform skew-x-[-10deg] shadow-[8px_8px_0px_rgba(0,0,0,0.2)]">
                <div className="skew-x-[10deg]">Get Started Now</div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 bg-brand-black border-t-4 border-brand-yellow">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img
                  src="/logo.png"
                  alt="Flexi Academy"
                  className="w-10 h-10 rounded-full object-cover grayscale brightness-200"
                />
                <span className="text-2xl font-display font-black tracking-tight uppercase text-white">
                  FLEXI<span className="text-brand-yellow">ACADEMY</span>
                </span>
              </div>
              <p className="text-white/50 font-medium max-w-sm leading-relaxed">
                Empowering women through intense fitness training, smart technology, and professional elite coaching.
              </p>
            </div>
            
            <div>
              <h5 className="text-sm font-black uppercase tracking-widest text-white mb-6">Quick Links</h5>
              <ul className="space-y-4 text-sm font-medium text-white/50">
                <li><a href="#packages" className="hover:text-brand-yellow transition-colors uppercase">Packages</a></li>
                <li><a href="#curriculum" className="hover:text-brand-yellow transition-colors uppercase">Curriculum</a></li>
                <li><a href="#features" className="hover:text-brand-yellow transition-colors uppercase">Features</a></li>
                <li><a href="#" className="hover:text-brand-yellow transition-colors uppercase">Privacy Policy</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-sm font-black uppercase tracking-widest text-white mb-6">Connect</h5>
              <div className="flex gap-4">
                <a 
                  href="https://www.instagram.com/flexi__academy/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-brand-darkgrey border-2 border-white/10 flex items-center justify-center text-white hover:bg-brand-yellow hover:border-brand-yellow hover:text-brand-black transition-all skew-x-[-10deg]"
                >
                  <div className="skew-x-[10deg]"><Instagram className="w-5 h-5" /></div>
                </a>
                <a 
                  href="tel:+918080332877"
                  className="w-12 h-12 bg-brand-darkgrey border-2 border-white/10 flex items-center justify-center text-white hover:bg-brand-yellow hover:border-brand-yellow hover:text-brand-black transition-all skew-x-[-10deg]"
                >
                  <div className="skew-x-[10deg]"><Phone className="w-5 h-5" /></div>
                </a>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10 gap-4">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
              © 2024 FLEXI FITNESS ACADEMY. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Stay Hard</span>
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Push Limits</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

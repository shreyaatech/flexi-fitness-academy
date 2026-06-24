/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        // Store user info in localStorage for demo purposes
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-brand-yellow transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs uppercase tracking-widest">Back to Home</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mx-auto mb-6">
              <img
                src="/logo.png"
                alt="Flexi Academy"
                className="w-24 h-24 rounded-full object-cover shadow-2xl shadow-brand-yellow/20 ring-2 ring-gold/30"
              />
            </div>
            <h1 className="text-4xl font-display mb-2">Welcome Back</h1>
            <p className="text-white/40 uppercase tracking-widest text-[10px]">Access your elite fitness ecosystem</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 ml-1">Member ID / Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input 
                  type="text" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your ID or Email"
                  className="w-full bg-brand-darkgrey/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-brand-yellow/50 focus:bg-brand-darkgrey transition-all outline-none text-sm text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase tracking-[0.2em] text-white/40">Password</label>
                <button type="button" className="text-[10px] uppercase tracking-[0.2em] text-brand-yellow hover:text-white transition-colors">Forgot?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-brand-darkgrey/50 border border-white/5 rounded-2xl py-4 pl-12 pr-12 focus:border-brand-yellow/50 focus:bg-brand-darkgrey transition-all outline-none text-sm text-white"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-brand-yellow text-brand-black font-bold uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm text-white/40 mb-4">New to the Academy?</p>
            <Link to="/" className="text-xs uppercase tracking-widest text-brand-yellow hover:text-white transition-colors border-b border-brand-yellow/30 pb-1">
              Explore Membership Plans
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="p-8 text-center border-t border-white/5">
        <p className="text-[10px] text-white/20 uppercase tracking-widest">
          Secure Encryption Enabled • Flexi Fitness Academy
        </p>
      </footer>
    </div>
  );
}


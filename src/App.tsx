/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={
          <div className="min-h-screen bg-brand-black flex items-center justify-center text-white text-center">
            <div>
              <h1 className="text-6xl font-display font-black text-brand-yellow mb-4">404</h1>
              <p className="text-white/60 uppercase tracking-widest text-sm mb-8">Page not found</p>
              <a href="/" className="text-brand-yellow hover:text-white transition-colors text-sm uppercase tracking-widest">← Back to Home</a>
            </div>
          </div>
        } />
      </Routes>
    </Router>
  );
}

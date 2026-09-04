import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import {
  Scale,
  ShieldCheck,
  Lock,
  Mail,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('officer@metrix.gov.in');
  const [password, setPassword] = useState('Officer@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoUser = (userKey) => {
    const demo = DEMO_USERS[userKey];
    if (demo) {
      setEmail(demo.email);
      setPassword(demo.password);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-16 h-16 bg-brand-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-xl border border-brand-800">
          <Scale className="w-9 h-9 text-amber-400" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">
          METRIX-R76
        </h2>
        <p className="text-xs font-semibold text-slate-600 mt-1 uppercase tracking-wider">
          Ministry of Consumer Affairs, Food & Public Distribution
        </p>
        <p className="text-[11px] text-slate-400">
          Department of Consumer Affairs (DoCA) • Problem Statement ID: 26035
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="officer@metrix.gov.in"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              {loading ? 'Authenticating...' : 'Sign In to Laboratory Portal'}
            </button>
          </form>

          {/* 1-Click Demo Personas for Judges */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> SIH Demo Personas
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Click to auto-fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => selectDemoUser('LAB_OFFICER')}
                className="p-2 text-left bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-blue-900">Lab Officer</div>
                <div className="text-[10px] text-blue-600">Enter observations</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoUser('REVIEWER')}
                className="p-2 text-left bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-amber-900">Reviewer</div>
                <div className="text-[10px] text-amber-600">Inspect & review</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoUser('APPROVER')}
                className="p-2 text-left bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-emerald-900">Approver</div>
                <div className="text-[10px] text-emerald-600">Authorize & lock</div>
              </button>

              <button
                type="button"
                onClick={() => selectDemoUser('ADMIN')}
                className="p-2 text-left bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200 rounded-lg transition-colors"
              >
                <div className="font-bold text-purple-900">Admin</div>
                <div className="text-[10px] text-purple-600">Rule engine mgmt</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

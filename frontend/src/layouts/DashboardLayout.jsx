import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, DEMO_USERS } from '../context/AuthContext';
import {
  LayoutDashboard,
  Scale,
  ClipboardList,
  FileCheck2,
  Cpu,
  Wrench,
  History,
  LogOut,
  ChevronDown,
  ShieldCheck,
  UserCheck,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const [switching, setSwitching] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleRoleSwitch = async (roleKey) => {
    setSwitching(true);
    setRoleMenuOpen(false);
    try {
      await switchRole(roleKey);
      navigate('/');
    } catch (err) {
      alert('Error switching persona: ' + err.message);
    } finally {
      setSwitching(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Instrument Registry', path: '/instruments', icon: Scale },
    { label: 'Test Projects', path: '/projects', icon: ClipboardList },
    { label: 'Report Repository', path: '/reports', icon: FileCheck2 },
    { label: 'OIML Rule Engine', path: '/rules', icon: Cpu },
    { label: 'Equipment & Standards', path: '/equipment', icon: Wrench },
    { label: 'Audit Trail', path: '/audit', icon: History }
  ];

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'LAB_OFFICER': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REVIEWER': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'APPROVER': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Official Banner */}
      <header className="bg-brand-900 text-white border-b border-brand-800 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
          {/* Logo & Org branding */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-lg border border-white/20">
              <Scale className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-base sm:text-lg">METRIX-R76</span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded">
                  DoCA • OIML R-76
                </span>
              </div>
              <p className="text-[11px] text-slate-300 hidden sm:block">
                Department of Consumer Affairs • Legal Metrology Division • NAWI Automated Compliance Engine
              </p>
            </div>
          </div>

          {/* User profile & Quick Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Persona Switcher for Judges */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                disabled={switching}
                className="flex items-center gap-1.5 bg-brand-800 hover:bg-brand-700 border border-brand-700 text-xs text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-inner"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">Demo Persona:</span>
                <span className="text-amber-300 font-semibold">{user?.role}</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Switch Active User Persona (SIH Demo)
                  </div>
                  {Object.entries(DEMO_USERS).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => handleRoleSwitch(key)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        user?.role === key ? 'bg-blue-50 font-bold text-brand-700' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{info.label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{info.email}</span>
                      </div>
                      {user?.role === key && <span className="text-emerald-600 font-bold">● Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Current user badge */}
            <div className="hidden lg:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-white">{user?.full_name}</span>
              <span className="text-[10px] text-slate-300">{user?.designation}</span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-60 flex-shrink-0 hidden md:block">
          <div className="card p-3 sticky top-24 space-y-1">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Laboratory Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <div className="pt-4 border-t border-slate-100 mt-4 px-3 space-y-2">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Role</div>
              <div className={`text-xs px-2.5 py-1 rounded-md border font-semibold inline-block ${getRoleBadgeClass(user?.role)}`}>
                {user?.role}
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">
                {user?.department}
              </p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Government Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            © 2026 METRIX-R76 • Ministry of Consumer Affairs, Food & Public Distribution (DoCA) • Problem Statement ID: 26035
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            OIML Recommendation R-76 Verified Engine
          </span>
        </div>
      </footer>
    </div>
  );
}

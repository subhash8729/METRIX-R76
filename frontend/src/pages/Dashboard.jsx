import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        setLoading(true);
        const res = await api.getDashboardMetrics();
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-2">
        <Clock className="w-5 h-5 animate-spin text-brand-600" />
        <span className="text-sm font-medium">Fetching laboratory data from MySQL...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 bg-rose-50 border-rose-200 text-rose-800 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-rose-600 flex-shrink-0" />
        <div>
          <div className="font-bold">Error loading dashboard metrics</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  const { summary, status_counts, compliance_stats, recent_projects, recent_audits, pending_actions } = data || {};

  return (
    <div className="space-y-6">
      {/* Welcome & Role Action Banner */}
      <div className="card bg-gradient-to-r from-brand-900 to-slate-900 text-white p-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/10 text-amber-300 border border-white/20">
                Official Portal
              </span>
              <span className="text-xs text-slate-300">RRSL Faridabad & NPL India</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">
              Welcome back, {user?.full_name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Active Role: <span className="font-semibold text-white">{user?.role}</span> • {user?.department}. Automated compliance verification as per OIML Recommendation R-76.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(user?.role === 'LAB_OFFICER' || user?.role === 'ADMIN') && (
              <Link
                to="/instruments"
                className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Scale className="w-4 h-4" />
                Register Instrument
              </Link>
            )}
            <Link
              to="/projects"
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <ClipboardList className="w-4 h-4" />
              View Test Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{summary?.total_instruments || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Registered NAWIs</div>
            <div className="text-[10px] text-blue-600 font-medium">Class I, II, III Scales</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{summary?.total_projects || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Active Test Projects</div>
            <div className="text-[10px] text-amber-600 font-medium">{summary?.awaiting_review || 0} awaiting review</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{summary?.approved_reports || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Authorized Reports</div>
            <div className="text-[10px] text-emerald-600 font-medium">{compliance_stats?.PASS || 0} Passed OIML R-76</div>
          </div>
        </div>

        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 border border-purple-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800">{summary?.calibrated_equipment || 0}</div>
            <div className="text-xs font-semibold text-slate-500">Calibrated Weights</div>
            <div className="text-[10px] text-purple-600 font-medium">OIML E2 / F1 Standards</div>
          </div>
        </div>
      </div>

      {/* Pending Role Actions (If any) */}
      {pending_actions && pending_actions.length > 0 && (
        <div className="card p-4 bg-blue-50/60 border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              Action Items Required For Your Role ({user?.role})
            </div>
            <span className="text-[10px] bg-blue-200 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
              {pending_actions.length} Pending
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {pending_actions.map(action => (
              <Link
                key={action.id}
                to={action.link}
                className="bg-white p-3 rounded-lg border border-blue-100 hover:border-blue-300 shadow-sm flex items-center justify-between transition-colors text-xs"
              >
                <div>
                  <div className="font-bold text-slate-800">{action.title}</div>
                  <div className="text-[11px] text-slate-500">{action.description}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Recent Test Projects & Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800">Recent Type Evaluation Projects</h3>
                <p className="text-xs text-slate-500">Status of NAWI verification tests in progress</p>
              </div>
              <Link to="/projects" className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="table-th">Project UID</th>
                    <th className="table-th">Instrument</th>
                    <th className="table-th">Class</th>
                    <th className="table-th">Status</th>
                    <th className="table-th">Compliance</th>
                    <th className="table-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recent_projects && recent_projects.length > 0 ? (
                    recent_projects.map(proj => (
                      <tr key={proj.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="table-td font-semibold text-brand-700">{proj.project_uid}</td>
                        <td className="table-td">
                          <div className="font-medium text-slate-900">{proj.instrument_name}</div>
                          <div className="text-[11px] text-slate-500">{proj.manufacturer_name} • {proj.model_number}</div>
                        </td>
                        <td className="table-td">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {proj.accuracy_class?.replace('CLASS_', '')}
                          </span>
                        </td>
                        <td className="table-td">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                            proj.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            proj.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                            proj.status === 'CHANGES_REQUESTED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                            'bg-blue-50 text-blue-700 border-blue-300'
                          }`}>
                            {proj.status}
                          </span>
                        </td>
                        <td className="table-td">
                          {proj.overall_compliance === 'PASS' && <span className="badge-pass"><CheckCircle2 className="w-3 h-3" /> PASS</span>}
                          {proj.overall_compliance === 'FAIL' && <span className="badge-fail"><XCircle className="w-3 h-3" /> FAIL</span>}
                          {proj.overall_compliance === 'WARNING' && <span className="badge-warn"><AlertTriangle className="w-3 h-3" /> WARN</span>}
                          {proj.overall_compliance === 'PENDING' && <span className="badge-pending"><Clock className="w-3 h-3" /> Testing</span>}
                        </td>
                        <td className="table-td text-right">
                          <Link
                            to={`/projects/${proj.id}`}
                            className="text-xs font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 px-2.5 py-1.5 rounded transition-colors"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-xs text-slate-500">
                        No test projects registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Regulatory Audit Feed (1 col) */}
        <div className="space-y-4">
          <div className="card p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Immutable Audit Trail
              </h3>
              <Link to="/audit" className="text-xs font-semibold text-brand-600 hover:text-brand-800">
                All Logs
              </Link>
            </div>

            <div className="mt-3 space-y-3">
              {recent_audits && recent_audits.length > 0 ? (
                recent_audits.map(log => (
                  <div key={log.id} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Target: <span className="font-semibold text-slate-700">{log.entity} #{log.entity_id}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>By: {log.user_name || 'System'}</span>
                      <span className="font-mono bg-slate-200/60 px-1 rounded">{log.role}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-slate-400 py-4">No audit logs recorded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

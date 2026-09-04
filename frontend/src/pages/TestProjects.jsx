import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Scale,
  X,
  AlertCircle
} from 'lucide-react';

export default function TestProjects() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [ruleVersions, setRuleVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    instrument_id: searchParams.get('new_instrument_id') || '',
    laboratory_id: '1',
    rule_version_id: '1',
    start_date: new Date().toISOString().split('T')[0],
    expected_completion_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    temperature_celsius: 22.0,
    relative_humidity_percent: 50.0,
    atmospheric_pressure_hpa: 1013.25,
    location: 'RRSL Metrology Lab 2B',
    notes: 'Standard Type Evaluation Testing as per OIML R-76-1:2006'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const [projRes, instRes, rulesRes] = await Promise.all([
        api.getProjects(params),
        api.getInstruments(),
        api.getRuleVersions()
      ]);
      setProjects(projRes.data);
      setInstruments(instRes.data);
      setRuleVersions(rulesRes.data.rule_versions);

      if (!formData.instrument_id && instRes.data.length > 0) {
        setFormData(prev => ({ ...prev, instrument_id: String(instRes.data[0].id) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (searchParams.get('new_instrument_id')) {
      setModalOpen(true);
    }
  }, [statusFilter, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const payload = {
        instrument_id: parseInt(formData.instrument_id, 10),
        laboratory_id: parseInt(formData.laboratory_id, 10),
        rule_version_id: parseInt(formData.rule_version_id, 10),
        start_date: formData.start_date,
        expected_completion_date: formData.expected_completion_date,
        environmental_conditions: {
          temperature_celsius: parseFloat(formData.temperature_celsius),
          relative_humidity_percent: parseFloat(formData.relative_humidity_percent),
          atmospheric_pressure_hpa: parseFloat(formData.atmospheric_pressure_hpa),
          location: formData.location
        },
        notes: formData.notes
      };

      await api.createProject(payload);
      setModalOpen(false);
      await loadData();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-brand-700" />
            Type Evaluation Test Projects
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Lifecycle tracking from test planning & observation entry to review, authorization, and report finalization
          </p>
        </div>

        {(user?.role === 'LAB_OFFICER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            Create Test Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Project UID, Instrument Model, Serial Number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Project Statuses</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="TESTING_COMPLETED">TESTING_COMPLETED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="CHANGES_REQUESTED">CHANGES_REQUESTED</option>
              <option value="APPROVED">APPROVED</option>
              <option value="FINALIZED">FINALIZED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Project UID</th>
                <th className="table-th">Instrument Under Test</th>
                <th className="table-th">Rule Version</th>
                <th className="table-th">Assigned Officer</th>
                <th className="table-th text-center">Progress</th>
                <th className="table-th">Status</th>
                <th className="table-th">Compliance</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-xs text-slate-400">
                    Loading test projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-xs text-slate-500">
                    No test projects found matching criteria.
                  </td>
                </tr>
              ) : (
                projects.map((proj) => {
                  const progressPct = proj.total_tests > 0 ? Math.round((proj.completed_tests / proj.total_tests) * 100) : 0;
                  return (
                    <tr key={proj.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-td">
                        <div className="font-bold text-brand-700">{proj.project_uid}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Started: {new Date(proj.start_date).toLocaleDateString()}</div>
                      </td>
                      <td className="table-td">
                        <div className="font-semibold text-slate-900">{proj.instrument_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {proj.model_number} • S/N: {proj.serial_number}
                        </div>
                      </td>
                      <td className="table-td">
                        <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {proj.rule_version}
                        </span>
                      </td>
                      <td className="table-td text-xs font-medium text-slate-700">
                        {proj.officer_name || 'Assigned Officer'}
                      </td>
                      <td className="table-td text-center">
                        <div className="text-xs font-bold text-slate-800 mb-1">
                          {proj.completed_tests || 0} / {proj.total_tests || 0}
                        </div>
                        <div className="w-20 bg-slate-200 rounded-full h-1.5 mx-auto overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-600' : 'bg-brand-600'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="table-td">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          proj.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                          proj.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
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
                        {proj.overall_compliance === 'PENDING' && <span className="badge-pending"><Clock className="w-3 h-3" /> In Progress</span>}
                      </td>
                      <td className="table-td text-right">
                        <Link
                          to={`/projects/${proj.id}`}
                          className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          Open Workspace <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Initiate Type Evaluation Project</h3>
                <p className="text-xs text-slate-500">Auto-resolves applicable OIML tests based on instrument class</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Instrument Under Test *</label>
                <select
                  required
                  value={formData.instrument_id}
                  onChange={(e) => setFormData({ ...formData, instrument_id: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                >
                  <option value="">-- Choose Instrument from Registry --</option>
                  {instruments.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.model_number} - S/N: {inst.serial_number} - {inst.accuracy_class.replace('CLASS_', 'Class ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Applicable OIML Rule Version *</label>
                  <select
                    value={formData.rule_version_id}
                    onChange={(e) => setFormData({ ...formData, rule_version_id: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {ruleVersions.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.version_code} {v.is_published ? '(Active Official)' : '(Draft Revision)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Environmental conditions */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Initial Environmental Test Conditions
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.temperature_celsius}
                      onChange={(e) => setFormData({ ...formData, temperature_celsius: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Humidity (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.relative_humidity_percent}
                      onChange={(e) => setFormData({ ...formData, relative_humidity_percent: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Pressure (hPa)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.atmospheric_pressure_hpa}
                      onChange={(e) => setFormData({ ...formData, atmospheric_pressure_hpa: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg shadow-sm transition-colors"
                >
                  {submitting ? 'Creating Project...' : 'Initialize Test Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

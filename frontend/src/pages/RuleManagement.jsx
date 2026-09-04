import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Cpu,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileCode2,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export default function RuleManagement() {
  const { user } = useAuth();
  const [ruleVersions, setRuleVersions] = useState([]);
  const [testDefs, setTestDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    version_code: 'OIML-R76-2026-REV-B',
    changelog: 'Stricter repeatability limits (factor 0.8) and digital filter clause'
  });

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.getRuleVersions();
      setRuleVersions(res.data.rule_versions);
      setTestDefs(res.data.test_definitions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createDraftRuleVersion({
        version_code: formData.version_code,
        changelog: formData.changelog,
        rules_config: {
          standard: 'OIML R-76 Extended Draft',
          repeatability_tightened_factor: 0.8
        }
      });
      setModalOpen(false);
      await loadRules();
    } catch (err) {
      alert('Error creating draft rule: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async (id, code) => {
    if (!window.confirm(`Publish rule version '${code}'? Active rule versions cannot be modified in a way that affects past reports.`)) return;
    try {
      await api.publishRuleVersion(id);
      await loadRules();
    } catch (err) {
      alert('Publish failed: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-brand-700" />
            Configurable OIML Rule Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Regulatory standards, versioned calculation formulas, and clause definitions without code modifications
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/rules/simulator"
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <Play className="w-4 h-4 fill-white" />
            Open Rule Simulator
          </Link>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setModalOpen(true)}
              className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Draft New Rule Revision
            </button>
          )}
        </div>
      </div>

      {/* Concept Alert Banner */}
      <div className="card p-4 bg-brand-50/70 border-brand-200 text-xs text-brand-900">
        <div className="flex items-start gap-2.5">
          <Sparkles className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Key Architectural Innovation: Update Rules, Not The Codebase</span>
            <p className="text-slate-600 leading-relaxed">
              METRIX-R76 decouples regulatory clauses from the core application. Rule versions are immutable once published; existing finalized reports forever retain the exact rule version under which they were authorized.
            </p>
          </div>
        </div>
      </div>

      {/* Rule Versions List */}
      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Standard Rule Versions</h3>
          <span className="text-xs font-semibold text-slate-500">{ruleVersions.length} versions configured</span>
        </div>

        <div className="divide-y divide-slate-100">
          {ruleVersions.map(v => (
            <div key={v.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-slate-900">{v.version_code}</span>
                  {v.is_active ? (
                    <span className="badge-pass text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Active Official Standard
                    </span>
                  ) : (
                    <span className="badge-warn text-[10px]">
                      <Clock className="w-3 h-3" /> Draft Revision
                    </span>
                  )}
                  <span className="text-slate-400 font-mono">Released: {new Date(v.release_date).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-600 max-w-2xl">{v.changelog}</p>
                <div className="text-[11px] text-slate-400 font-mono">
                  {v.projects_using_version} test projects evaluated • {v.total_test_definitions} metrological test definitions
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  to={`/rules/simulator?version=${v.id}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                >
                  <Play className="w-3 h-3 fill-slate-700" /> Test In Simulator
                </Link>
                {!v.is_published && user?.role === 'ADMIN' && (
                  <button
                    onClick={() => handlePublish(v.id, v.version_code)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition-colors"
                  >
                    Publish & Activate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Definitions Table */}
      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">Standard Test Definitions & Clause Mappings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Test Code</th>
                <th className="table-th">Clause Reference</th>
                <th className="table-th">Test Name</th>
                <th className="table-th">Category</th>
                <th className="table-th">Mandatory</th>
                <th className="table-th">Formula Definition</th>
              </tr>
            </thead>
            <tbody>
              {testDefs.map(td => (
                <tr key={td.id} className="hover:bg-slate-50">
                  <td className="table-td font-mono font-bold text-xs text-brand-700">{td.test_code}</td>
                  <td className="table-td font-mono text-xs font-semibold">{td.clause_reference}</td>
                  <td className="table-td font-medium text-slate-900 text-xs">{td.test_name}</td>
                  <td className="table-td text-xs text-slate-600">{td.category}</td>
                  <td className="table-td text-xs">
                    {td.is_mandatory ? (
                      <span className="text-emerald-700 font-bold">Yes (Mandatory)</span>
                    ) : (
                      <span className="text-slate-400">Optional</span>
                    )}
                  </td>
                  <td className="table-td font-mono text-[11px] text-slate-600">
                    {JSON.stringify(td.formula_definition)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Draft Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Create Draft OIML Rule Version</h3>
            <p className="text-xs text-slate-500 mb-3">Clones standard test definitions and allows safe mathematical customization.</p>

            <form onSubmit={handleCreateDraft} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Version Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OIML-R76-2026-REV-B"
                  value={formData.version_code}
                  onChange={(e) => setFormData({ ...formData, version_code: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Changelog & Justification</label>
                <textarea
                  rows="3"
                  required
                  value={formData.changelog}
                  onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
                >
                  {submitting ? 'Creating...' : 'Create Draft Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

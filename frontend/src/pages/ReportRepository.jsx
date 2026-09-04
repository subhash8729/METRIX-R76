import React, { useEffect, useState } from 'react';
import { api, getReportPdfUrl, getReportDocxUrl } from '../api/client';
import {
  FileCheck2,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building,
  Calendar,
  Eye
} from 'lucide-react';

export default function ReportRepository() {
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [compliance, setCompliance] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (compliance) params.compliance = compliance;
      if (accuracyClass) params.accuracy_class = accuracyClass;

      const res = await api.getReports(params);
      setReports(res.data.reports || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [search, compliance, accuracyClass]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <FileCheck2 className="w-6 h-6 text-brand-700" />
          Searchable Digital Report Repository
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Centralized national archive of finalized OIML R-76 Type Evaluation and Verification reports
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Report Number, Serial Number, Model, Manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={compliance}
              onChange={(e) => setCompliance(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Compliance Statuses</option>
              <option value="PASS">PASS (Conforming)</option>
              <option value="FAIL">FAIL (Non-Compliant)</option>
            </select>
          </div>

          <div>
            <select
              value={accuracyClass}
              onChange={(e) => setAccuracyClass(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Accuracy Classes</option>
              <option value="CLASS_I">Class I</option>
              <option value="CLASS_II">Class II</option>
              <option value="CLASS_III">Class III</option>
              <option value="CLASS_IIII">Class IIII</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Report Number</th>
                <th className="table-th">Instrument Under Test</th>
                <th className="table-th">Manufacturer & Lab</th>
                <th className="table-th">Standard Version</th>
                <th className="table-th">Compliance</th>
                <th className="table-th">Finalized Date</th>
                <th className="table-th text-right">Download Formats</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-400">
                    Loading digital repository archives...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-500">
                    No finalized test reports found matching search criteria.
                  </td>
                </tr>
              ) : (
                reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div className="font-bold text-brand-900">{r.report_number}</div>
                      <div className="text-[10px] font-mono text-slate-400">
                        SHA-256: {r.checksum_hash?.substring(0, 16)}...
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="font-semibold text-slate-900">{r.instrument_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Model: {r.model_number} • S/N: {r.serial_number}
                      </div>
                    </td>
                    <td className="table-td text-xs">
                      <div className="font-medium text-slate-800">{r.manufacturer_name}</div>
                      <div className="text-[10px] text-slate-400">{r.lab_name}</div>
                    </td>
                    <td className="table-td">
                      <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {r.rule_version}
                      </span>
                    </td>
                    <td className="table-td">
                      {r.overall_compliance === 'PASS' && <span className="badge-pass"><CheckCircle2 className="w-3 h-3" /> PASS</span>}
                      {r.overall_compliance === 'FAIL' && <span className="badge-fail"><XCircle className="w-3 h-3" /> FAIL</span>}
                    </td>
                    <td className="table-td text-xs text-slate-600">
                      <div>{new Date(r.finalized_at || r.created_at).toLocaleDateString('en-GB')}</div>
                      <div className="text-[10px] text-slate-400">By: {r.approved_by_name || 'Approver'}</div>
                    </td>
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getReportPdfUrl(r.id)}
                          className="bg-brand-900 hover:bg-brand-800 text-white text-xs font-bold px-2.5 py-1.5 rounded inline-flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                        <a
                          href={getReportDocxUrl(r.id)}
                          className="bg-blue-700 hover:bg-blue-600 text-white text-xs font-bold px-2.5 py-1.5 rounded inline-flex items-center gap-1 shadow-sm transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" /> DOCX
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

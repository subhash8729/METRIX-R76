import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Eye,
  X,
  ChevronDown
} from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (entityFilter) params.entity = entityFilter;
      if (actionFilter) params.action = actionFilter;

      const res = await api.getAuditLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [entityFilter, actionFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <History className="w-6 h-6 text-brand-700" />
          Immutable Regulatory Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Complete non-repudiable audit logs of every instrument registration, observation entry, technical review, and report authorization
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter by Entity</label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Entities</option>
              <option value="INSTRUMENT">INSTRUMENT</option>
              <option value="TEST_PROJECT">TEST_PROJECT</option>
              <option value="TEST_INSTANCE">TEST_INSTANCE</option>
              <option value="OBSERVATION">OBSERVATION</option>
              <option value="REPORT">REPORT</option>
              <option value="RULE_VERSION">RULE_VERSION</option>
              <option value="USER">USER</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Filter by Action</label>
            <input
              type="text"
              placeholder="e.g. CREATE, UPDATE, FINALIZE, REVIEW"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Timestamp</th>
                <th className="table-th">User & Role</th>
                <th className="table-th">Action</th>
                <th className="table-th">Target Entity</th>
                <th className="table-th">IP Address</th>
                <th className="table-th text-right">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-xs text-slate-400">
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-xs text-slate-500">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td text-xs font-mono text-slate-500">
                      {new Date(log.created_at).toLocaleString('en-GB')}
                    </td>
                    <td className="table-td">
                      <div className="font-bold text-slate-900 text-xs">{log.user_name || 'System / Auto'}</div>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border">
                        {log.user_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="table-td font-mono font-bold text-xs text-brand-700">
                      {log.action}
                    </td>
                    <td className="table-td text-xs">
                      <span className="font-semibold text-slate-800">{log.entity}</span>
                      <span className="text-slate-400 text-[10px] ml-1 font-mono">#{log.entity_id}</span>
                    </td>
                    <td className="table-td font-mono text-xs text-slate-500">
                      {log.ip_address}
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* State Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Audit Record #{selectedLog.id} State Inspector
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-100 font-mono">
                <div>Action: <span className="font-bold text-slate-800">{selectedLog.action}</span></div>
                <div>Entity: <span className="font-bold text-slate-800">{selectedLog.entity} #{selectedLog.entity_id}</span></div>
                <div>User: <span className="font-bold text-slate-800">{selectedLog.user_name} ({selectedLog.user_role})</span></div>
                <div>Time: <span className="font-bold text-slate-800">{new Date(selectedLog.created_at).toLocaleString()}</span></div>
              </div>

              {selectedLog.before_state && (
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">State Prior to Change (Before):</span>
                  <pre className="p-3 bg-slate-900 text-rose-300 rounded-lg text-[11px] overflow-x-auto max-h-36">
                    {JSON.stringify(selectedLog.before_state, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Recorded State (After):</span>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-lg text-[11px] overflow-x-auto max-h-48">
                  {JSON.stringify(selectedLog.after_state, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100 mt-4">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

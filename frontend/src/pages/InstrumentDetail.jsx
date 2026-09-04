import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getReportPdfUrl, getReportDocxUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Upload,
  History,
  Download,
  Building,
  Tag,
  ShieldCheck,
  Plus
} from 'lucide-react';

export default function InstrumentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('PHOTO');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getInstrumentById(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('title', docTitle || selectedFile.name);
      formData.append('document_type', docType);

      await api.uploadInstrumentDocument(id, formData);
      setUploadOpen(false);
      setSelectedFile(null);
      setDocTitle('');
      await loadData();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-2">
        <Clock className="w-5 h-5 animate-spin text-brand-600" />
        <span className="text-sm">Loading instrument lifecycle history...</span>
      </div>
    );
  }

  const { instrument, documents, test_projects, reports, audit_history } = data || {};

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/instruments"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Registry
          </Link>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Scale className="w-6 h-6 text-brand-700" />
            {instrument?.name}
          </h1>
          <p className="text-xs text-slate-500 font-mono">
            UID: {instrument?.instrument_uid} • S/N: {instrument?.serial_number} • Model: {instrument?.model_number}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(user?.role === 'LAB_OFFICER' || user?.role === 'ADMIN') && (
            <>
              <button
                onClick={() => setUploadOpen(true)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" /> Upload Evidence / Photo
              </button>
              <Link
                to={`/projects?new_instrument_id=${id}`}
                className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-4 py-2 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Start New Test Project
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Grid: Tech Specs & Manufacturer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Specifications Card (2 cols) */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-600" />
              Metrological Parameters (OIML R-76)
            </h3>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
              instrument?.accuracy_class === 'CLASS_I' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              instrument?.accuracy_class === 'CLASS_II' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              instrument?.accuracy_class === 'CLASS_III' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              {instrument?.accuracy_class?.replace('CLASS_', 'Class ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Maximum Capacity (Max)</span>
              <span className="font-bold text-slate-800 text-sm">{instrument?.max_capacity} {instrument?.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Minimum Capacity (Min)</span>
              <span className="font-bold text-slate-800 text-sm">{instrument?.min_capacity} {instrument?.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Verification Interval (e)</span>
              <span className="font-bold text-brand-700 text-sm">{instrument?.verification_scale_interval_e} {instrument?.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Actual Interval (d)</span>
              <span className="font-bold text-slate-800 text-sm">{instrument?.actual_scale_interval_d} {instrument?.unit}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Scale Intervals (n = Max/e)</span>
              <span className="font-bold text-slate-800 text-sm">{instrument?.number_of_intervals_n}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Tare Facility</span>
              <span className="font-bold text-slate-800 text-sm">{instrument?.tare_type}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Display Technology</span>
              <span className="font-medium text-slate-700">{instrument?.display_type}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Software Version</span>
              <span className="font-mono font-medium text-slate-700">{instrument?.software_version}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">Temperature Range</span>
              <span className="font-medium text-slate-700">{instrument?.temperature_min}°C to {instrument?.temperature_max}°C</span>
            </div>
          </div>
        </div>

        {/* Manufacturer & Lab Card (1 col) */}
        <div className="card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-brand-600" />
              Manufacturer & Custody
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Manufacturer</span>
              <span className="font-bold text-slate-800 text-sm">{instrument?.manufacturer_name}</span>
              <p className="text-slate-500 text-[11px] mt-0.5">{instrument?.manufacturer_address}</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Testing Laboratory</span>
              <span className="font-bold text-slate-800">{instrument?.lab_name}</span>
              <p className="text-slate-500 text-[11px]">Lab Code: {instrument?.lab_code} ({instrument?.lab_city})</p>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Registered By</span>
              <span className="font-medium text-slate-700">{instrument?.created_by_name || 'Legal Metrology Officer'}</span>
              <p className="text-slate-400 text-[10px]">{new Date(instrument?.created_at).toLocaleDateString('en-GB')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Evidence & Photos */}
      <div className="card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-brand-600" />
            Uploaded Documents, Photos & Nameplate Evidence ({documents?.length || 0})
          </h3>
        </div>

        {documents && documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {documents.map(doc => (
              <div key={doc.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <div className="font-bold text-slate-800 truncate">{doc.title}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{doc.document_type} • {new Date(doc.created_at).toLocaleDateString()}</div>
                </div>
                <a
                  href={`/${doc.file_path}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-white border border-slate-200 hover:bg-brand-50 rounded text-brand-700"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No photographs or documents attached yet. Click "Upload Evidence / Photo" above to attach nameplate or test setup photos.
          </div>
        )}
      </div>

      {/* Requirement #26: Instrument-wise Historical Test Projects */}
      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-600" />
              Complete Test Projects History
            </h3>
            <p className="text-xs text-slate-500">Every type evaluation and verification cycle performed for this instrument</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Project UID</th>
                <th className="table-th">Rule Version</th>
                <th className="table-th">Test Officer</th>
                <th className="table-th">Start Date</th>
                <th className="table-th">Status</th>
                <th className="table-th">Compliance</th>
                <th className="table-th text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {test_projects && test_projects.length > 0 ? (
                test_projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="table-td font-bold text-brand-700">{p.project_uid}</td>
                    <td className="table-td font-mono text-xs">{p.rule_version}</td>
                    <td className="table-td text-xs font-medium text-slate-800">{p.officer_name || 'Assigned Officer'}</td>
                    <td className="table-td text-xs">{new Date(p.start_date).toLocaleDateString('en-GB')}</td>
                    <td className="table-td">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.status === 'FINALIZED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        p.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        'bg-blue-50 text-blue-700 border-blue-300'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="table-td">
                      {p.overall_compliance === 'PASS' && <span className="badge-pass"><CheckCircle2 className="w-3 h-3" /> PASS</span>}
                      {p.overall_compliance === 'FAIL' && <span className="badge-fail"><XCircle className="w-3 h-3" /> FAIL</span>}
                      {p.overall_compliance === 'PENDING' && <span className="badge-pending"><Clock className="w-3 h-3" /> Testing</span>}
                    </td>
                    <td className="table-td text-right">
                      <Link
                        to={`/projects/${p.id}`}
                        className="text-xs font-semibold text-brand-700 hover:text-brand-900 bg-slate-100 hover:bg-brand-50 px-2.5 py-1.5 rounded transition-colors"
                      >
                        View Project
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-xs text-slate-500">
                    No test projects initiated for this instrument yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generated Reports for this Instrument */}
      <div className="card">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Standardized Reports Archive
          </h3>
        </div>

        <div className="p-4">
          {reports && reports.length > 0 ? (
            <div className="space-y-2">
              {reports.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{r.report_number}</span>
                    <span className="ml-2 font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">v{r.report_version}</span>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Approved by: {r.approver_name || 'Controller Legal Metrology'} • Finalized: {new Date(r.finalized_at).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SHA-256 Checksum: {r.checksum_hash?.substring(0, 32)}...
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={getReportPdfUrl(r.id)}
                      className="bg-brand-900 hover:bg-brand-800 text-white px-3 py-1.5 rounded text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                    <a
                      href={getReportDocxUrl(r.id)}
                      className="bg-blue-700 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold inline-flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" /> Word (DOCX)
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-400 text-center py-3">
              No finalized reports for this instrument yet. Reports are automatically generated once test projects are finalized and approved.
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {uploadOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Upload Technical Document / Photo Evidence</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Caption</label>
                <input
                  type="text"
                  placeholder="e.g. Instrument Nameplate Photo"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                >
                  <option value="NAMEPLATE">Nameplate Photo</option>
                  <option value="PHOTO">Test Setup Photo</option>
                  <option value="MANUAL">Manufacturer Manual</option>
                  <option value="TECH_SPEC">Technical Specification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (Image / PDF / DOCX)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

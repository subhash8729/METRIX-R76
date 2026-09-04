import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, getReportPdfUrl, getReportDocxUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  ArrowLeft,
  Scale,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Send,
  Check,
  RotateCcw,
  Lock,
  Download,
  ShieldCheck,
  ArrowRight,
  Cpu,
  Wrench,
  AlertCircle
} from 'lucide-react';

export default function TestProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [reviewComments, setReviewComments] = useState('');

  const loadProject = async () => {
    try {
      setLoading(true);
      const res = await api.getProjectById(id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject();
  }, [id]);

  // Submit for Review
  const handleSubmitReview = async () => {
    if (!window.confirm('Submit this test project for technical review? Ensure all mandatory tests are completed.')) return;
    setActionLoading(true);
    try {
      await api.submitProjectForReview(id);
      await loadProject();
    } catch (err) {
      alert('Cannot submit: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Reviewer Decision
  const handleReviewDecision = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.reviewProject(id, {
        decision: reviewDecision,
        comments: reviewComments
      });
      setReviewModalOpen(false);
      setReviewComments('');
      await loadProject();
    } catch (err) {
      alert('Review action failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Final Approval & Report Generation
  const handleFinalizeAndApprove = async () => {
    if (!window.confirm('Authorize and finalize this Type Evaluation Test Project? This will permanently lock all observations, generate official PDF & DOCX reports, and compute a tamper-evident SHA-256 checksum.')) return;
    setActionLoading(true);
    try {
      await api.finalizeAndApproveProject(id, {
        comments: 'Authorized by Controller of Legal Metrology (DoCA)'
      });
      await loadProject();
    } catch (err) {
      alert('Finalization failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-2">
        <Clock className="w-5 h-5 animate-spin text-brand-600" />
        <span className="text-sm">Loading test project workspace...</span>
      </div>
    );
  }

  const { project, test_instances, equipment, reviews, report } = data || {};
  const isFinalized = project?.status === 'FINALIZED';
  const env = typeof project?.environmental_conditions === 'string'
    ? JSON.parse(project.environmental_conditions)
    : (project?.environmental_conditions || {});

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/projects"
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Test Projects
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {project?.project_uid}
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              isFinalized ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
              project?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
              project?.status === 'UNDER_REVIEW' ? 'bg-amber-50 text-amber-700 border-amber-300' :
              project?.status === 'CHANGES_REQUESTED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
              'bg-blue-50 text-blue-700 border-blue-300'
            }`}>
              {project?.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {project?.instrument_name} • Model: {project?.model_number} • Rule: <span className="font-mono font-bold text-slate-700">{project?.rule_version}</span>
          </p>
        </div>

        {/* Action Controls Bar according to role & workflow state */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Lab Officer: Submit for review */}
          {!isFinalized && (project?.status === 'IN_PROGRESS' || project?.status === 'CHANGES_REQUESTED') && (user?.role === 'LAB_OFFICER' || user?.role === 'ADMIN') && (
            <button
              onClick={handleSubmitReview}
              disabled={actionLoading}
              className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Submit for Technical Review
            </button>
          )}

          {/* Reviewer: Technical Review */}
          {!isFinalized && project?.status === 'UNDER_REVIEW' && (user?.role === 'REVIEWER' || user?.role === 'ADMIN') && (
            <button
              onClick={() => setReviewModalOpen(true)}
              disabled={actionLoading}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Complete Technical Review
            </button>
          )}

          {/* Approver: Finalize and Lock */}
          {!isFinalized && project?.status === 'APPROVED' && (user?.role === 'APPROVER' || user?.role === 'ADMIN') && (
            <button
              onClick={handleFinalizeAndApprove}
              disabled={actionLoading}
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-md transition-colors inline-flex items-center gap-1.5 animate-pulse"
            >
              <ShieldCheck className="w-4 h-4" /> Finalize, Lock & Issue Reports
            </button>
          )}

          {/* If Finalized: Download Reports */}
          {isFinalized && report && (
            <div className="flex items-center gap-2">
              <a
                href={getReportPdfUrl(report.id)}
                className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download PDF Report
              </a>
              <a
                href={getReportDocxUrl(report.id)}
                className="bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                <Download className="w-4 h-4" /> Download Word (DOCX)
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Finalized Banner if locked */}
      {isFinalized && (
        <div className="card p-4 bg-emerald-50/80 border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-emerald-900">
                Type Evaluation Report #{report?.report_number} Finalized & Legally Locked
              </div>
              <div className="text-[11px] text-emerald-700 font-mono">
                Tamper-Evident SHA-256: {report?.checksum_hash}
              </div>
            </div>
          </div>
          <span className="badge-pass text-xs">
            <CheckCircle2 className="w-3.5 h-3.5" /> OIML R-76 Conforming
          </span>
        </div>
      )}

      {/* Grid: Specifications & Testing Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-brand-700" />
            Instrument Under Test
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="font-bold text-slate-900">{project?.instrument_name}</div>
            <div className="text-slate-600">Model: {project?.model_number} • S/N: {project?.serial_number}</div>
            <div className="flex items-center gap-2 pt-1">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded border">
                {project?.accuracy_class?.replace('CLASS_', 'Class ')}
              </span>
              <span className="text-slate-600">Max: {project?.max_capacity} {project?.unit}</span>
              <span className="text-slate-600">e: {project?.verification_scale_interval_e} {project?.unit}</span>
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-brand-700" />
            Active OIML Rule Version
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="font-bold font-mono text-brand-700">{project?.rule_version}</div>
            <div className="text-slate-500 text-[11px] leading-relaxed">
              {project?.rule_changelog || 'Official OIML R-76-1:2006 metrological requirements.'}
            </div>
            <div className="text-[10px] text-slate-400">
              Evaluation rules are version-locked to this test project.
            </div>
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Wrench className="w-4 h-4 text-brand-700" />
            Environmental & Lab Standards
          </h3>
          <div className="space-y-1 text-xs text-slate-700">
            <div>Ambient Temp: <span className="font-bold">{env.temperature_celsius || '22.0'} °C</span></div>
            <div>Relative Humidity: <span className="font-bold">{env.relative_humidity_percent || '50.0'} %</span></div>
            <div>Reference Weights: <span className="font-medium text-slate-600">{equipment?.map(e => e.name).join(', ') || 'Class E2/F1 Standards'}</span></div>
          </div>
        </div>
      </div>

      {/* Test Matrix: Applicable Tests Generated by Rule Engine */}
      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-brand-700" />
              Applicable Metrological Test Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Clauses automatically resolved by OIML Rule Engine for {project?.accuracy_class?.replace('CLASS_', 'Class ')} NAWI
            </p>
          </div>
          <div className="text-xs font-bold text-slate-700">
            Overall Compliance:{' '}
            {project?.overall_compliance === 'PASS' && <span className="badge-pass"><CheckCircle2 className="w-3 h-3" /> PASS</span>}
            {project?.overall_compliance === 'FAIL' && <span className="badge-fail"><XCircle className="w-3 h-3" /> FAIL</span>}
            {project?.overall_compliance === 'WARNING' && <span className="badge-warn"><AlertTriangle className="w-3 h-3" /> WARNING</span>}
            {project?.overall_compliance === 'PENDING' && <span className="badge-pending"><Clock className="w-3 h-3" /> In Progress</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Seq</th>
                <th className="table-th">Clause & Test Name</th>
                <th className="table-th">Category</th>
                <th className="table-th">Observations</th>
                <th className="table-th">Status</th>
                <th className="table-th">Evaluation</th>
                <th className="table-th text-right">Execute</th>
              </tr>
            </thead>
            <tbody>
              {test_instances && test_instances.length > 0 ? (
                test_instances.map((ti, index) => (
                  <tr key={ti.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-mono text-xs text-slate-400 font-bold">{index + 1}</td>
                    <td className="table-td">
                      <div className="font-bold text-slate-900">{ti.test_name}</div>
                      <div className="text-[11px] text-brand-700 font-mono font-medium">
                        {ti.clause_reference} {ti.is_mandatory && <span className="text-rose-600 font-sans">*Mandatory</span>}
                      </div>
                    </td>
                    <td className="table-td text-xs text-slate-600">{ti.category}</td>
                    <td className="table-td font-mono text-xs text-slate-700">
                      {ti.observation_count || 0} recorded
                    </td>
                    <td className="table-td">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        ti.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        ti.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                        'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {ti.status}
                      </span>
                    </td>
                    <td className="table-td">
                      {ti.compliance_result === 'PASS' && <span className="badge-pass"><CheckCircle2 className="w-3 h-3" /> PASS</span>}
                      {ti.compliance_result === 'FAIL' && <span className="badge-fail"><XCircle className="w-3 h-3" /> FAIL</span>}
                      {ti.compliance_result === 'NOT_EVALUATED' && <span className="badge-pending"><Clock className="w-3 h-3" /> Pending</span>}
                    </td>
                    <td className="table-td text-right">
                      <Link
                        to={`/projects/${id}/tests/${ti.id}`}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Enter / View Data <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-xs text-slate-500">
                    No tests instantiated.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review History Logs */}
      {reviews && reviews.length > 0 && (
        <div className="card p-4 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
            Review & Authorization Log
          </h3>
          <div className="space-y-2">
            {reviews.map(r => (
              <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">
                    {r.reviewer_name} ({r.review_type})
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    r.decision === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}>
                    {r.decision}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px]">{r.comments}</p>
                <div className="text-[10px] text-slate-400">
                  {new Date(r.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Technical Reviewer Assessment</h3>
            <p className="text-xs text-slate-500 mb-3">Inspect all observations, turning point calculations, and tolerances before deciding.</p>

            <form onSubmit={handleReviewDecision} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Review Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                >
                  <option value="APPROVED">APPROVED (Recommend for Final Authorization)</option>
                  <option value="CHANGES_REQUESTED">CHANGES_REQUESTED (Return to Test Officer for revision)</option>
                  <option value="REJECTED">REJECTED (Non-compliant with OIML R-76)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Technical Review Comments</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter detailed reviewer remarks, observation audits, and tolerance checks..."
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
                >
                  {actionLoading ? 'Saving...' : 'Submit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

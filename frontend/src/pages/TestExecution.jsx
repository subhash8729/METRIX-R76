import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  ArrowLeft,
  Scale,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  HelpCircle,
  Calculator,
  Save,
  Upload,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function TestExecution() {
  const { projectId, testInstanceId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);

  // Active Set & Observation Form State
  const [activeSetId, setActiveSetId] = useState('');
  const [newSetName, setNewSetName] = useState('');
  const [newSetLoad, setNewSetLoad] = useState('');
  const [newSetPos, setNewSetPos] = useState('Center');
  const [setModalOpen, setSetModalOpen] = useState(false);

  // Observation Inputs
  const [loadApplied, setLoadApplied] = useState('');
  const [indicatedValue, setIndicatedValue] = useState('');
  const [deltaLoad, setDeltaLoad] = useState('0.02');
  const [notes, setNotes] = useState('');

  // Live calculation preview state
  const [livePreview, setLivePreview] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Explain Calculation Modal State
  const [explainModalOpen, setExplainModalOpen] = useState(false);
  const [activeExplanation, setActiveExplanation] = useState(null);

  // Evidence Upload State
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [activeObsId, setActiveObsId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadTestData = async () => {
    try {
      setLoading(true);
      const res = await api.getTestInstanceDetails(testInstanceId);
      setTestData(res.data);

      const sets = res.data.measurement_sets || [];
      if (sets.length > 0 && !activeSetId) {
        setActiveSetId(String(sets[0].id));
        setLoadApplied(String(sets[0].load_value || ''));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTestData();
  }, [testInstanceId]);

  // Trigger Live Calculation when inputs change
  useEffect(() => {
    if (!testData?.test_instance) return;
    const inst = testData.test_instance;

    const runLiveCalc = async () => {
      if (loadApplied === '' || indicatedValue === '') {
        setLivePreview(null);
        return;
      }

      setCalcLoading(true);
      try {
        const res = await api.liveCalculate({
          accuracyClass: inst.accuracy_class,
          verificationIntervalE: inst.verification_scale_interval_e,
          actualIntervalD: inst.actual_scale_interval_d,
          loadApplied: parseFloat(loadApplied),
          indicatedValue: parseFloat(indicatedValue),
          deltaLoad: parseFloat(deltaLoad || 0),
          testCode: inst.test_code
        });
        setLivePreview(res.data);
      } catch (err) {
        // quiet fail on incomplete number typing
      } finally {
        setCalcLoading(false);
      }
    };

    const debounceTimer = setTimeout(runLiveCalc, 250);
    return () => clearTimeout(debounceTimer);
  }, [loadApplied, indicatedValue, deltaLoad, testData]);

  // Create new measurement set
  const handleCreateSet = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createMeasurementSet(testInstanceId, {
        set_name: newSetName,
        load_value: parseFloat(newSetLoad || 0),
        position: newSetPos
      });
      setSetModalOpen(false);
      setNewSetName('');
      setNewSetLoad('');
      await loadTestData();
      setActiveSetId(String(res.data.id));
    } catch (err) {
      alert('Failed to add measurement set: ' + err.message);
    }
  };

  // Save Observation to Backend
  const handleSaveObservation = async (e) => {
    e.preventDefault();
    if (!activeSetId) {
      alert('Please select or create a measurement set first.');
      return;
    }

    setSubmitting(true);
    try {
      await api.saveObservation(testInstanceId, activeSetId, {
        load_applied: parseFloat(loadApplied),
        indicated_value: parseFloat(indicatedValue),
        delta_load: parseFloat(deltaLoad || 0),
        notes
      });
      // Clear inputs for next load entry
      setIndicatedValue('');
      setNotes('');
      await loadTestData();
    } catch (err) {
      alert('Failed to save observation: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Complete and Evaluate Test Instance
  const handleEvaluateTest = async () => {
    if (!window.confirm('Run automated compliance evaluation for this test? Results will be summarized based on OIML R-76 tolerances.')) return;
    setEvaluating(true);
    try {
      const res = await api.evaluateTestInstance(testInstanceId);
      alert(`Evaluation Complete: ${res.data.compliance_result}\n${res.data.summary}`);
      await loadTestData();
    } catch (err) {
      alert('Evaluation failed: ' + err.message);
    } finally {
      setEvaluating(false);
    }
  };

  // Upload Evidence for Observation
  const handleUploadEvidence = async (e) => {
    e.preventDefault();
    if (!selectedFile || !activeObsId) return;

    try {
      const formData = new FormData();
      formData.append('evidence', selectedFile);
      await api.uploadObservationEvidence(activeObsId, formData);
      setEvidenceModalOpen(false);
      setSelectedFile(null);
      await loadTestData();
    } catch (err) {
      alert('Failed to upload evidence: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500 gap-2">
        <Clock className="w-5 h-5 animate-spin text-brand-600" />
        <span className="text-sm">Loading test observation workspace...</span>
      </div>
    );
  }

  const { test_instance: ti, measurement_sets: sets } = testData || {};
  const activeSet = sets?.find(s => String(s.id) === String(activeSetId)) || sets?.[0];
  const allObservations = sets?.flatMap(s => s.observations || []) || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to={`/projects/${projectId}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Project Workspace
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              {ti?.test_name}
            </h1>
            <span className="font-mono text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded border border-brand-200 font-bold">
              {ti?.clause_reference}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {ti?.instrument_name} • Class: <span className="font-semibold text-slate-700">{ti?.accuracy_class?.replace('CLASS_', '')}</span> • e = <span className="font-semibold text-slate-700">{ti?.verification_scale_interval_e} {ti?.unit}</span> • Max = <span className="font-semibold text-slate-700">{ti?.max_capacity} {ti?.unit}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleEvaluateTest}
            disabled={evaluating || allObservations.length === 0}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            {evaluating ? 'Evaluating...' : 'Evaluate & Complete Test'}
          </button>
        </div>
      </div>

      {/* Clause Description & Regulatory Rule Info */}
      <div className="card p-4 bg-blue-50/50 border-blue-200">
        <div className="flex items-start gap-3">
          <Calculator className="w-5 h-5 text-brand-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-slate-900">Clause Requirement & Calculation Methodology</div>
            <p className="text-slate-600 leading-relaxed">{ti?.test_description}</p>
            <div className="text-[11px] font-mono text-brand-800 pt-1">
              Turning Point formula: <span className="font-bold">P = I + 0.5*e - delta_L</span> • Error: <span className="font-bold">E = P - L</span> • Permissible: <span className="font-bold">|Ec| &lt;= mpe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Observation Entry & Live Calculation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Observation Form & Sets */}
        <div className="lg:col-span-2 card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900">Digital Observation Entry</h3>
              <span className="text-[11px] text-slate-400">({allObservations.length} observations recorded)</span>
            </div>
            <button
              onClick={() => setSetModalOpen(true)}
              className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Load Step
            </button>
          </div>

          {/* Measurement Set Tabs */}
          {sets && sets.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs">
              {sets.map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSetId(String(s.id));
                    setLoadApplied(String(s.load_value || ''));
                  }}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    String(activeSetId) === String(s.id)
                      ? 'bg-brand-900 text-white shadow-sm font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.set_name} {s.load_value ? `(${s.load_value} ${ti?.unit})` : ''}
                </button>
              ))}
            </div>
          )}

          {/* Entry Form */}
          <form onSubmit={handleSaveObservation} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Test Load Applied (L) *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500"
                    value={loadApplied}
                    onChange={(e) => setLoadApplied(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-l-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs px-2.5 flex items-center rounded-r-lg font-semibold">
                    {ti?.unit || 'g'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indication Reading (I) *
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 500.0"
                    value={indicatedValue}
                    onChange={(e) => setIndicatedValue(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-l-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs px-2.5 flex items-center rounded-r-lg font-semibold">
                    {ti?.unit || 'g'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Turning Point (ΔL)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 0.02"
                    value={deltaLoad}
                    onChange={(e) => setDeltaLoad(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-l-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                  <span className="bg-slate-100 border border-l-0 border-slate-200 text-slate-500 text-xs px-2.5 flex items-center rounded-r-lg font-semibold">
                    {ti?.unit || 'g'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <input
                type="text"
                placeholder="Optional observation notes / reference weight serial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-xs p-2 border border-slate-200 rounded-lg w-2/3 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submitting || !loadApplied || !indicatedValue}
                className="bg-brand-900 hover:bg-brand-800 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                {submitting ? 'Calculating & Saving...' : 'Record Observation'}
              </button>
            </div>
          </form>
        </div>

        {/* Right 1 Col: Live Real-Time Automation Preview (SIH Innovation) */}
        <div className="card p-5 bg-slate-900 text-white space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              Automated Calculation Engine
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
          </div>

          {livePreview ? (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1 font-mono">
                <div className="text-slate-400 text-[10px]">Turning Point (P):</div>
                <div className="text-base font-bold text-white">
                  {livePreview.calculated_turning_point_P} {ti?.unit}
                </div>
                <div className="text-[10px] text-slate-400">P = I + 0.5*e - ΔL</div>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-slate-400 text-[10px]">Corrected Error (Ec):</div>
                  <div className={`text-sm font-bold ${livePreview.corrected_error_Ec > 0 ? 'text-amber-300' : 'text-blue-300'}`}>
                    {livePreview.corrected_error_Ec >= 0 ? `+${livePreview.corrected_error_Ec}` : livePreview.corrected_error_Ec} {ti?.unit}
                  </div>
                </div>

                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-slate-400 text-[10px]">Permissible (mpe):</div>
                  <div className="text-sm font-bold text-emerald-400">
                    ±{livePreview.permissible_error_mpe} {ti?.unit}
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="p-3 rounded-lg border flex items-center justify-between font-bold" style={{
                backgroundColor: livePreview.status === 'PASS' ? '#064e3b' : '#7f1d1d',
                borderColor: livePreview.status === 'PASS' ? '#059669' : '#dc2626'
              }}>
                <span className="flex items-center gap-1.5">
                  {livePreview.status === 'PASS' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
                  Compliance Result:
                </span>
                <span className="tracking-wider">{livePreview.status}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActiveExplanation(livePreview.explanation);
                  setExplainModalOpen(true);
                }}
                className="w-full text-center text-xs font-semibold text-amber-300 hover:text-amber-200 bg-white/10 py-2 rounded-lg border border-white/10 flex items-center justify-center gap-1 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Explain Calculation Steps
              </button>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 space-y-2">
              <Calculator className="w-8 h-8 text-slate-600 mx-auto animate-pulse" />
              <p>Enter test load and indicated value on the left to see live OIML calculation & mpe limits.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recorded Observations Table */}
      <div className="card">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recorded Test Observations Table</h3>
            <p className="text-xs text-slate-500">Clause {ti?.clause_reference} verification log</p>
          </div>
          <span className="text-xs font-bold text-slate-700">
            Test Status:{' '}
            <span className={`px-2.5 py-0.5 rounded-full border text-xs ${
              ti?.compliance_result === 'PASS' ? 'badge-pass' :
              ti?.compliance_result === 'FAIL' ? 'badge-fail' :
              'badge-pending'
            }`}>
              {ti?.compliance_result || 'NOT_EVALUATED'}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Load (L)</th>
                <th className="table-th">Indication (I)</th>
                <th className="table-th">Turning Pt (P)</th>
                <th className="table-th">Error (Ec)</th>
                <th className="table-th">Limit (mpe)</th>
                <th className="table-th">Result</th>
                <th className="table-th">Evidence</th>
                <th className="table-th text-right">Explain</th>
              </tr>
            </thead>
            <tbody>
              {allObservations.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-xs text-slate-500">
                    No observations recorded for this test yet. Use the form above to add readings.
                  </td>
                </tr>
              ) : (
                allObservations.map((obs) => (
                  <tr key={obs.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td font-semibold text-slate-900">{obs.load_applied} {ti?.unit}</td>
                    <td className="table-td font-mono text-xs text-slate-700">{obs.indicated_value} {ti?.unit}</td>
                    <td className="table-td font-mono text-xs text-brand-700 font-bold">{obs.calculated_turning_point_P}</td>
                    <td className="table-td font-mono text-xs font-bold">
                      {obs.corrected_error_Ec >= 0 ? `+${obs.corrected_error_Ec}` : obs.corrected_error_Ec}
                    </td>
                    <td className="table-td font-mono text-xs text-slate-600">±{obs.permissible_error_mpe}</td>
                    <td className="table-td">
                      {obs.status === 'PASS' && <span className="badge-pass"><CheckCircle2 className="w-3 h-3" /> PASS</span>}
                      {obs.status === 'FAIL' && <span className="badge-fail"><XCircle className="w-3 h-3" /> FAIL</span>}
                      {obs.status === 'WARNING' && <span className="badge-warn"><AlertTriangle className="w-3 h-3" /> WARN</span>}
                    </td>
                    <td className="table-td">
                      {obs.evidence_file ? (
                        <a
                          href={`/${obs.evidence_file}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-brand-600 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View Photo
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            setActiveObsId(obs.id);
                            setEvidenceModalOpen(true);
                          }}
                          className="text-[11px] font-semibold text-slate-500 hover:text-brand-700 inline-flex items-center gap-1 bg-slate-100 hover:bg-brand-50 px-2 py-1 rounded"
                        >
                          <Upload className="w-3 h-3" /> Attach
                        </button>
                      )}
                    </td>
                    <td className="table-td text-right">
                      <button
                        onClick={() => {
                          setActiveExplanation(obs.calculation_explanation);
                          setExplainModalOpen(true);
                        }}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> View Steps
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Measurement Set Modal */}
      {setModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Add Test Load Step / Position</h3>
            <form onSubmit={handleCreateSet} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Step Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50% Max Load, Center, Front-Left"
                  value={newSetName}
                  onChange={(e) => setNewSetName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Load Value ({ti?.unit})</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 3000"
                  value={newSetLoad}
                  onChange={(e) => setNewSetLoad(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Load Position</label>
                <select
                  value={newSetPos}
                  onChange={(e) => setNewSetPos(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                >
                  <option value="Center">Center of Load Receptor</option>
                  <option value="Front-Left">Front-Left Quarter</option>
                  <option value="Front-Right">Front-Right Quarter</option>
                  <option value="Rear-Left">Rear-Left Quarter</option>
                  <option value="Rear-Right">Rear-Right Quarter</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSetModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
                >
                  Add Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Requirement #30 & #41: Explain Calculation Breakdown Modal ("Why did this happen?") */}
      {explainModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-brand-700" />
                <h3 className="font-bold text-base text-slate-900">Explainable OIML Calculation</h3>
              </div>
              <button
                onClick={() => setExplainModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Configured OIML Formula</span>
                <div className="text-xs font-bold text-brand-800">
                  {activeExplanation?.formula || 'P = I + 0.5*e - delta_L; E = P - L; Ec = E - E0'}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Step-by-Step Mathematical Trace</span>
                {activeExplanation?.steps ? (
                  activeExplanation.steps.map((step, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-100 font-mono text-[11px] text-slate-700">
                      • {step}
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-slate-50 rounded text-slate-500 font-mono">
                    Evaluation formula derived from Table 6 OIML R-76-1:2006.
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl border flex items-center justify-between font-bold" style={{
                backgroundColor: activeExplanation?.result === 'PASS' ? '#f0fdf4' : '#fef2f2',
                borderColor: activeExplanation?.result === 'PASS' ? '#86efac' : '#fca5a5',
                color: activeExplanation?.result === 'PASS' ? '#166534' : '#991b1b'
              }}>
                <span>Condition: {activeExplanation?.condition || '|Ec| <= mpe'}</span>
                <span className="text-sm tracking-wider uppercase">{activeExplanation?.result || 'PASS'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
              <button
                onClick={() => setExplainModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Evidence Modal */}
      {evidenceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-2">Attach Photo / Weight Evidence</h3>
            <form onSubmit={handleUploadEvidence} className="space-y-3">
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50"
              />
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEvidenceModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-brand-900 hover:bg-brand-800 rounded-lg"
                >
                  Upload Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import {
  Play,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Cpu
} from 'lucide-react';

export default function RuleSimulator() {
  const [searchParams] = useSearchParams();
  const [ruleVersionId, setRuleVersionId] = useState(searchParams.get('version') || '1');
  const [testCode, setTestCode] = useState('TEST-WEIGH-PERF');
  const [accuracyClass, setAccuracyClass] = useState('CLASS_III');
  const [verificationIntervalE, setVerificationIntervalE] = useState('5');
  const [actualIntervalD, setActualIntervalD] = useState('1');
  const [loadApplied, setLoadApplied] = useState('5000');
  const [indicatedValue, setIndicatedValue] = useState('5000');
  const [deltaLoad, setDeltaLoad] = useState('0.02');
  const [zeroError, setZeroError] = useState('0');

  // Simulation output
  const [simOutput, setSimOutput] = useState(null);
  const [simulating, setSimulating] = useState(false);

  const handleSimulate = async (e) => {
    if (e) e.preventDefault();
    setSimulating(true);
    try {
      const res = await api.simulateRule({
        ruleVersionId: parseInt(ruleVersionId, 10),
        testCode,
        accuracyClass,
        verificationIntervalE: parseFloat(verificationIntervalE),
        actualIntervalD: parseFloat(actualIntervalD),
        loadApplied: parseFloat(loadApplied),
        indicatedValue: parseFloat(indicatedValue),
        deltaLoad: parseFloat(deltaLoad || 0),
        zeroError: parseFloat(zeroError || 0)
      });
      setSimOutput(res.data);
    } catch (err) {
      alert('Simulation error: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // Run initial simulation on mount
  React.useEffect(() => {
    handleSimulate();
  }, []);

  const result = simOutput?.result;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link
          to="/rules"
          className="text-xs font-semibold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1 mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Rule Management
        </Link>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
          <Play className="w-6 h-6 text-amber-500 fill-amber-500" />
          Interactive OIML Rule Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Execute arbitrary test loads, evaluate Table 6 mpe tiers live, and inspect full explainable calculation traces
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulator Controls (5 cols) */}
        <div className="lg:col-span-5 card p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Simulation Parameters
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
              SIH Demonstration Mode
            </span>
          </div>

          <form onSubmit={handleSimulate} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Rule Version</label>
              <select
                value={ruleVersionId}
                onChange={(e) => setRuleVersionId(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
              >
                <option value="1">OIML-R76-2006-V1 (Official Active Standard)</option>
                <option value="2">OIML-R76-2026-DRAFT (Draft Tightened Repeatability)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Test Clause</label>
              <select
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg font-medium"
              >
                <option value="TEST-WEIGH-PERF">Clause A.4.4 - Weighing Performance & Error</option>
                <option value="TEST-ZERO-TARE">Clause A.4.2 - Zero-Setting Accuracy</option>
                <option value="TEST-DISCRIMINATION">Clause A.4.8 - Discrimination (1.4d Test)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Accuracy Class</label>
                <select
                  value={accuracyClass}
                  onChange={(e) => setAccuracyClass(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-bold"
                >
                  <option value="CLASS_I">Class I</option>
                  <option value="CLASS_II">Class II</option>
                  <option value="CLASS_III">Class III</option>
                  <option value="CLASS_IIII">Class IIII</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Interval e (g)</label>
                <input
                  type="number"
                  step="any"
                  value={verificationIntervalE}
                  onChange={(e) => setVerificationIntervalE(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Test Load Applied (L)</label>
                <input
                  type="number"
                  step="any"
                  value={loadApplied}
                  onChange={(e) => setLoadApplied(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reading Indication (I)</label>
                <input
                  type="number"
                  step="any"
                  value={indicatedValue}
                  onChange={(e) => setIndicatedValue(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Turning Point (ΔL)</label>
                <input
                  type="number"
                  step="any"
                  value={deltaLoad}
                  onChange={(e) => setDeltaLoad(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Zero Error (E0)</label>
                <input
                  type="number"
                  step="any"
                  value={zeroError}
                  onChange={(e) => setZeroError(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full bg-brand-900 hover:bg-brand-800 text-white font-bold py-2.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              <RefreshCw className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
              Run Rule Simulation
            </button>
          </form>
        </div>

        {/* Simulator Results & Visual Trace (7 cols) */}
        <div className="lg:col-span-7 card p-5 bg-slate-900 text-white space-y-4">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" />
              Automated Calculation Breakdown
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Engine Version: {simOutput?.simulation_context?.rule_version}
            </span>
          </div>

          {result ? (
            <div className="space-y-4 text-xs">
              {/* Result Badge */}
              <div className="p-3.5 rounded-xl border flex items-center justify-between font-black" style={{
                backgroundColor: result.status === 'PASS' ? '#064e3b' : '#7f1d1d',
                borderColor: result.status === 'PASS' ? '#059669' : '#dc2626'
              }}>
                <span className="flex items-center gap-2 text-sm">
                  {result.status === 'PASS' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                  Compliance Result:
                </span>
                <span className="text-base tracking-wider uppercase">{result.status}</span>
              </div>

              {/* Primary Calculations Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono">
                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-slate-400 text-[10px]">Turning Point (P):</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {result.calculated_turning_point_P || 0}
                  </div>
                </div>

                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-slate-400 text-[10px]">Corrected Error (Ec):</div>
                  <div className={`text-sm font-bold mt-0.5 ${result.corrected_error_Ec >= 0 ? 'text-amber-300' : 'text-blue-300'}`}>
                    {result.corrected_error_Ec >= 0 ? `+${result.corrected_error_Ec}` : result.corrected_error_Ec}
                  </div>
                </div>

                <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-slate-400 text-[10px]">Permissible (mpe):</div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    ±{result.permissible_error_mpe}
                  </div>
                </div>
              </div>

              {/* Table 6 Range info */}
              {result.mpe_details && (
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-1">
                  <div className="text-amber-300 text-[11px] font-bold">
                    OIML R-76 Table 6 Verification Interval Range:
                  </div>
                  <div className="font-mono text-slate-300 text-[11px]">
                    m/e = {result.mpe_details.m_over_e} verification intervals ({result.mpe_details.range_description})
                  </div>
                </div>
              )}

              {/* Step-by-Step Mathematical Explainability */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5" /> Explainable Calculation Steps:
                </div>
                {result.explanation?.steps ? (
                  result.explanation.steps.map((s, idx) => (
                    <div key={idx} className="p-2 bg-slate-800/80 rounded border border-slate-700/60 font-mono text-[11px] text-slate-200">
                      • {s}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 font-mono">Steps evaluated according to OIML R-76 clause formula.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              Run simulation to view live calculation execution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

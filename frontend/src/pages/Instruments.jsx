import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Scale,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function Instruments() {
  const { user } = useAuth();
  const [instruments, setInstruments] = useState([]);
  const [auxData, setAuxData] = useState({ manufacturers: [], laboratories: [] });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [accuracyClass, setAccuracyClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    model_number: '',
    serial_number: '',
    manufacturer_id: '1',
    laboratory_id: '1',
    accuracy_class: 'CLASS_III',
    max_capacity: '15000',
    min_capacity: '100',
    verification_scale_interval_e: '5',
    actual_scale_interval_d: '1',
    unit: 'g',
    tare_type: 'Subtractive Tare',
    display_type: 'Digital LCD Display',
    software_version: 'v1.0.0',
    temperature_min: '10',
    temperature_max: '40',
    voltage_nominal: '230V AC, 50Hz'
  });

  const loadInstruments = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (accuracyClass) params.accuracy_class = accuracyClass;
      if (statusFilter) params.status = statusFilter;

      const [instRes, auxRes] = await Promise.all([
        api.getInstruments(params),
        api.getAuxiliaryData()
      ]);
      setInstruments(instRes.data);
      setAuxData(auxRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstruments();
  }, [search, accuracyClass, statusFilter]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.registerInstrument(formData);
      setModalOpen(false);
      // Reset form
      setFormData({
        name: '',
        model_number: '',
        serial_number: '',
        manufacturer_id: '1',
        laboratory_id: '1',
        accuracy_class: 'CLASS_III',
        max_capacity: '15000',
        min_capacity: '100',
        verification_scale_interval_e: '5',
        actual_scale_interval_d: '1',
        unit: 'g',
        tare_type: 'Subtractive Tare',
        display_type: 'Digital LCD Display',
        software_version: 'v1.0.0',
        temperature_min: '10',
        temperature_max: '40',
        voltage_nominal: '230V AC, 50Hz'
      });
      await loadInstruments();
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
            <Scale className="w-6 h-6 text-brand-700" />
            NAWI Instrument Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Registered Non-Automatic Weighing Instruments & complete lifecycle test archives
          </p>
        </div>

        {(user?.role === 'LAB_OFFICER' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            Register New Instrument
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by name, model, serial number, UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <select
              value={accuracyClass}
              onChange={(e) => setAccuracyClass(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Accuracy Classes</option>
              <option value="CLASS_I">Class I (Special)</option>
              <option value="CLASS_II">Class II (High)</option>
              <option value="CLASS_III">Class III (Medium)</option>
              <option value="CLASS_IIII">Class IIII (Ordinary)</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="UNDER_TEST">Under Test</option>
              <option value="TESTED">Tested</option>
            </select>
          </div>
        </div>
      </div>

      {/* Instruments Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">UID & Model</th>
                <th className="table-th">Manufacturer</th>
                <th className="table-th">Class</th>
                <th className="table-th">Capacity (Max / e)</th>
                <th className="table-th">Status</th>
                <th className="table-th text-center">Test Projects</th>
                <th className="table-th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-400">
                    Loading instruments from database...
                  </td>
                </tr>
              ) : instruments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-xs text-slate-500">
                    No instruments found matching criteria.
                  </td>
                </tr>
              ) : (
                instruments.map((inst) => (
                  <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="table-td">
                      <div className="font-bold text-slate-900">{inst.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        UID: {inst.instrument_uid} • S/N: {inst.serial_number}
                      </div>
                    </td>
                    <td className="table-td">
                      <div className="font-medium text-slate-800">{inst.manufacturer_name}</div>
                      <div className="text-[11px] text-slate-400">{inst.manufacturer_country}</div>
                    </td>
                    <td className="table-td">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono border ${
                        inst.accuracy_class === 'CLASS_I' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        inst.accuracy_class === 'CLASS_II' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        inst.accuracy_class === 'CLASS_III' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {inst.accuracy_class.replace('CLASS_', 'Class ')}
                      </span>
                    </td>
                    <td className="table-td">
                      <div className="text-xs font-semibold text-slate-800">
                        Max: {inst.max_capacity} {inst.unit}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        e = {inst.verification_scale_interval_e} {inst.unit} (n={inst.number_of_intervals_n})
                      </div>
                    </td>
                    <td className="table-td">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        inst.status === 'TESTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                        inst.status === 'UNDER_TEST' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {inst.status}
                      </span>
                    </td>
                    <td className="table-td text-center font-bold text-xs text-brand-700">
                      {inst.total_tests || 0}
                    </td>
                    <td className="table-td text-right">
                      <Link
                        to={`/instruments/${inst.id}`}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        History & Details <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Register Non-Automatic Weighing Instrument</h3>
                <p className="text-xs text-slate-500">Add technical metrological specifications according to OIML R-76</p>
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

            <form onSubmit={handleRegister} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Instrument Name / Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Precision Electronic Bench Scale"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Manufacturer *</label>
                  <select
                    value={formData.manufacturer_id}
                    onChange={(e) => setFormData({ ...formData, manufacturer_id: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {auxData.manufacturers.map(m => (
                      <option key={m.id} value={m.id}>{m.manufacturer_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Combics-CW1P"
                    value={formData.model_number}
                    onChange={(e) => setFormData({ ...formData, model_number: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SART-2026-9901"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accuracy Class *</label>
                  <select
                    value={formData.accuracy_class}
                    onChange={(e) => setFormData({ ...formData, accuracy_class: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="CLASS_I">Class I (Special Accuracy)</option>
                    <option value="CLASS_II">Class II (High Accuracy)</option>
                    <option value="CLASS_III">Class III (Medium Accuracy)</option>
                    <option value="CLASS_IIII">Class IIII (Ordinary Accuracy)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Maximum Capacity (Max) *</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="e.g. 15000"
                      value={formData.max_capacity}
                      onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="mg">mg</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Verification Interval (e) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 5"
                    value={formData.verification_scale_interval_e}
                    onChange={(e) => setFormData({ ...formData, verification_scale_interval_e: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Actual Scale Interval (d)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1"
                    value={formData.actual_scale_interval_d}
                    onChange={(e) => setFormData({ ...formData, actual_scale_interval_d: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Minimum Capacity (Min)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 100"
                    value={formData.min_capacity}
                    onChange={(e) => setFormData({ ...formData, min_capacity: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tare Facility</label>
                  <select
                    value={formData.tare_type}
                    onChange={(e) => setFormData({ ...formData, tare_type: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Subtractive Tare">Subtractive Tare</option>
                    <option value="Additive / Subtractive Tare">Additive / Subtractive Tare</option>
                    <option value="None">None</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Testing Laboratory</label>
                  <select
                    value={formData.laboratory_id}
                    onChange={(e) => setFormData({ ...formData, laboratory_id: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    {auxData.laboratories.map(l => (
                      <option key={l.id} value={l.id}>{l.lab_name} ({l.lab_code})</option>
                    ))}
                  </select>
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
                  {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

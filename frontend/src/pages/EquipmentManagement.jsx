import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Wrench,
  Plus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
  Calendar,
  X
} from 'lucide-react';

export default function EquipmentManagement() {
  const { user } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    equipment_code: '',
    name: '',
    manufacturer: '',
    model: '',
    serial_number: '',
    accuracy_class: 'E2',
    capacity_range: '1 mg to 1000 g',
    calibration_date: new Date().toISOString().split('T')[0],
    calibration_expiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    certificate_number: ''
  });

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const res = await api.getEquipment();
      setEquipment(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addEquipment(formData);
      setModalOpen(false);
      setFormData({
        equipment_code: '',
        name: '',
        manufacturer: '',
        model: '',
        serial_number: '',
        accuracy_class: 'E2',
        capacity_range: '1 mg to 1000 g',
        calibration_date: new Date().toISOString().split('T')[0],
        calibration_expiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
        certificate_number: ''
      });
      await loadEquipment();
    } catch (err) {
      alert('Error adding equipment: ' + err.message);
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
            <Wrench className="w-6 h-6 text-brand-700" />
            Reference Standards & Test Equipment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Certified OIML reference weight sets, environmental meters, and calibration traceability
          </p>
        </div>

        {(user?.role === 'ADMIN' || user?.role === 'LAB_OFFICER') && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-brand-900 hover:bg-brand-800 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 self-start"
          >
            <Plus className="w-4 h-4" />
            Add Reference Equipment
          </button>
        )}
      </div>

      {/* Equipment Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="table-th">Code & Name</th>
                <th className="table-th">Class / Range</th>
                <th className="table-th">Serial Number</th>
                <th className="table-th">Calibration Cert</th>
                <th className="table-th">Calibration Expiry</th>
                <th className="table-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-xs text-slate-400">
                    Loading equipment data...
                  </td>
                </tr>
              ) : (
                equipment.map((eq) => {
                  const status = eq.computed_status || eq.status;
                  return (
                    <tr key={eq.id} className="hover:bg-slate-50 transition-colors">
                      <td className="table-td">
                        <div className="font-bold text-slate-900">{eq.name}</div>
                        <div className="text-[10px] text-brand-700 font-mono font-medium">{eq.equipment_code}</div>
                      </td>
                      <td className="table-td text-xs">
                        <span className="font-bold text-slate-800 font-mono bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                          {eq.accuracy_class}
                        </span>
                        <span className="text-slate-500 text-[11px]">{eq.capacity_range}</span>
                      </td>
                      <td className="table-td font-mono text-xs text-slate-600">{eq.serial_number || 'N/A'}</td>
                      <td className="table-td font-mono text-xs text-slate-800">{eq.certificate_number}</td>
                      <td className="table-td text-xs">
                        {new Date(eq.calibration_expiry).toLocaleDateString('en-GB')}
                      </td>
                      <td className="table-td">
                        {status === 'CALIBRATED' && (
                          <span className="badge-pass">
                            <CheckCircle2 className="w-3 h-3" /> Calibrated
                          </span>
                        )}
                        {status === 'EXPIRING_SOON' && (
                          <span className="badge-warn">
                            <AlertTriangle className="w-3 h-3" /> Expiring Soon
                          </span>
                        )}
                        {status === 'EXPIRED' && (
                          <span className="badge-fail">
                            <XCircle className="w-3 h-3" /> Expired (Do Not Use)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-sm text-slate-900 mb-1">Add Calibrated Reference Equipment</h3>
            <form onSubmit={handleAdd} className="space-y-3 mt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Equipment Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EQ-STD-E2-03"
                  value={formData.equipment_code}
                  onChange={(e) => setFormData({ ...formData, equipment_code: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OIML E2 Class Standard Weight Box"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Accuracy Class</label>
                  <select
                    value={formData.accuracy_class}
                    onChange={(e) => setFormData({ ...formData, accuracy_class: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  >
                    <option value="E1">OIML E1</option>
                    <option value="E2">OIML E2</option>
                    <option value="F1">OIML F1</option>
                    <option value="F2">OIML F2</option>
                    <option value="M1">OIML M1</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Capacity Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 mg to 1000 g"
                    value={formData.capacity_range}
                    onChange={(e) => setFormData({ ...formData, capacity_range: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Calibration Certificate Number</label>
                <input
                  type="text"
                  placeholder="e.g. RRSL/CAL/2026/0991"
                  value={formData.certificate_number}
                  onChange={(e) => setFormData({ ...formData, certificate_number: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Calibration Date</label>
                  <input
                    type="date"
                    value={formData.calibration_date}
                    onChange={(e) => setFormData({ ...formData, calibration_date: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.calibration_expiry}
                    onChange={(e) => setFormData({ ...formData, calibration_expiry: e.target.value })}
                    className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                  />
                </div>
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
                  {submitting ? 'Adding...' : 'Add Equipment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

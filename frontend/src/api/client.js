export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export const getReportPdfUrl = (reportId) => {
  const token = localStorage.getItem('metrix_token');
  return `${API_BASE_URL}/reports/${reportId}/pdf${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

export const getReportDocxUrl = (reportId) => {
  const token = localStorage.getItem('metrix_token');
  return `${API_BASE_URL}/reports/${reportId}/docx${token ? `?token=${encodeURIComponent(token)}` : ''}`;
};

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('metrix_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // If body is FormData, delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || `HTTP ${response.status}: Request failed`;
    const err = new Error(errorMsg);
    err.code = data?.error?.code || 'API_ERROR';
    err.details = data?.error?.details;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  getProfile: () => apiRequest('/auth/me'),
  getUsers: () => apiRequest('/auth/users'),

  // Dashboard
  getDashboardMetrics: () => apiRequest('/dashboard/metrics'),

  // Instruments
  getInstruments: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/instruments${query ? `?${query}` : ''}`);
  },
  getInstrumentById: (id) => apiRequest(`/instruments/${id}`),
  registerInstrument: (data) => apiRequest('/instruments', { method: 'POST', body: JSON.stringify(data) }),
  uploadInstrumentDocument: (id, formData) => apiRequest(`/instruments/${id}/documents`, { method: 'POST', body: formData }),
  getAuxiliaryData: () => apiRequest('/instruments/auxiliary'),

  // Test Projects
  getProjects: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/test-projects${query ? `?${query}` : ''}`);
  },
  getProjectById: (id) => apiRequest(`/test-projects/${id}`),
  createProject: (data) => apiRequest('/test-projects', { method: 'POST', body: JSON.stringify(data) }),

  // Test Execution
  getTestInstanceDetails: (instanceId) => apiRequest(`/tests/instances/${instanceId}`),
  createMeasurementSet: (instanceId, data) => apiRequest(`/tests/instances/${instanceId}/sets`, { method: 'POST', body: JSON.stringify(data) }),
  saveObservation: (instanceId, setId, data) => apiRequest(`/tests/instances/${instanceId}/sets/${setId}/observations`, { method: 'POST', body: JSON.stringify(data) }),
  liveCalculate: (data) => apiRequest('/tests/calculate-live', { method: 'POST', body: JSON.stringify(data) }),
  evaluateTestInstance: (instanceId) => apiRequest(`/tests/instances/${instanceId}/evaluate`, { method: 'POST' }),
  uploadObservationEvidence: (obsId, formData) => apiRequest(`/tests/observations/${obsId}/evidence`, { method: 'POST', body: formData }),

  // Reviews & Approvals
  submitProjectForReview: (projectId) => apiRequest(`/reviews/projects/${projectId}/submit`, { method: 'POST' }),
  reviewProject: (projectId, data) => apiRequest(`/reviews/projects/${projectId}/review`, { method: 'POST', body: JSON.stringify(data) }),
  finalizeAndApproveProject: (projectId, data = {}) => apiRequest(`/reviews/projects/${projectId}/finalize`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  getReports: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/reports${query ? `?${query}` : ''}`);
  },
  getReportById: (id) => apiRequest(`/reports/${id}`),

  // Rule Administration & Simulator
  getRuleVersions: () => apiRequest('/rules/versions'),
  createDraftRuleVersion: (data) => apiRequest('/rules/versions', { method: 'POST', body: JSON.stringify(data) }),
  publishRuleVersion: (id) => apiRequest(`/rules/versions/${id}/publish`, { method: 'POST' }),
  simulateRule: (data) => apiRequest('/rules/simulate', { method: 'POST', body: JSON.stringify(data) }),

  // Equipment
  getEquipment: () => apiRequest('/equipment'),
  addEquipment: (data) => apiRequest('/equipment', { method: 'POST', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/audit-logs${query ? `?${query}` : ''}`);
  }
};

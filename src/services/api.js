const API_BASE_URL = import.meta.env.VITE_APPS_SCRIPT_URL || 'https://script.google.com/macros/s/REPLACE_ME/exec';

async function parseResponse(response) {
  const data = await response.json();
  if (!data.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }
  return data.data;
}

async function get(action, params = {}) {
  const url = new URL(API_BASE_URL);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), {
    method: 'GET'
  });

  return parseResponse(response);
}

async function post(action, payload = {}) {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify({ action, payload })
  });

  return parseResponse(response);
}

export const api = {
  ping: () => get('ping'),
  getCenters: () => get('getCenters'),
  loginBranch: (payload) => post('loginBranch', payload),
  loginAdmin: (payload) => post('loginAdmin', payload),
  getSession: (sessionToken) => get('getSession', { sessionToken }),
  getAssociates: (sessionToken) => get('getAssociates', { sessionToken }),
  selectAssociate: (payload) => post('selectAssociate', payload),
  getQueue: (payload) => get('getQueue', payload),
  getStudent: (payload) => get('getStudent', payload),
  getBulkStudents: (payload) => get('getBulkStudents', payload),
  startBoarding: (payload) => post('startBoarding', payload),
  updateStudentEmail: (payload) => post('updateStudentEmail', payload),
  saveDraft: (payload) => post('saveDraft', payload),
  generateOtp: (payload) => post('generateOtp', payload),
  resendOtp: (payload) => post('resendOtp', payload),
  verifyOtp: (payload) => post('verifyOtp', payload),
  startBulkBatch: (payload) => post('startBulkBatch', payload),
  saveBulkDraft: (payload) => post('saveBulkDraft', payload),
  generateBulkOtps: (payload) => post('generateBulkOtps', payload),
  resendBulkOtp: (payload) => post('resendBulkOtp', payload),
  verifyBulkOtps: (payload) => post('verifyBulkOtps', payload),
  sendTestConfirmationEmail: (payload) => post('sendTestConfirmationEmail', payload),
  getDashboard: (sessionToken) => get('getDashboard', { sessionToken }),
  getPanIndiaDashboard: (sessionToken) => get('getPanIndiaDashboard', { sessionToken }),
  getAuditTrail: (payload) => get('getAuditTrail', payload)
};

/**
 * Simple API client for Google Apps Script Web App
 * Note: GAS web apps don't support custom headers easily from browser,
 * so we send everything as JSON body or query params.
 */

async function apiCall(action, data = {}, method = 'POST') {
  const payload = { action, ...data };

  try {
    let url = API_BASE;
    let options = {
      method: method,
      redirect: 'follow'
    };

    if (method === 'GET') {
      const params = new URLSearchParams(payload);
      url = API_BASE + '?' + params.toString();
    } else {
      options.headers = { 'Content-Type': 'text/plain;charset=utf-8' }; // GAS quirk
      options.body = JSON.stringify(payload);
    }

    const res = await fetch(url, options);
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error('Invalid JSON from API', text);
      return { success: false, error: 'Invalid server response' };
    }
    return json;
  } catch (err) {
    console.error('API error', err);
    return { success: false, error: err.message || 'Network error' };
  }
}

// Convenience wrappers
const API = {
  // Customer
  submitRequest: (data) => apiCall('submitRequest', data),
  getRequestStatus: (requestId) => apiCall('getRequestStatus', { requestId }, 'GET'),
  getQuotation: (quotationId, token) => apiCall('getQuotation', { quotationId, token }, 'GET'),
  acceptQuotation: (data) => apiCall('acceptQuotation', data),
  submitPayment: (data) => apiCall('submitPayment', data),
  uploadReference: (data) => apiCall('uploadReference', data),

  // Admin
  adminLogin: (email, password) => apiCall('adminLogin', { email, password }),
  adminValidate: (token) => apiCall('adminValidate', { token }),
  getDashboard: (token) => apiCall('getDashboard', { token }),
  getRequests: (token, filters = {}) => apiCall('getRequests', { token, ...filters }),
  getRequest: (token, requestId) => apiCall('getRequest', { token, requestId }),
  updateRequestStatus: (token, data) => apiCall('updateRequestStatus', { token, ...data }),
  addSourcingOption: (token, data) => apiCall('addSourcingOption', { token, ...data }),
  createQuotation: (token, data) => apiCall('createQuotation', { token, ...data }),
  confirmPayment: (token, data) => apiCall('confirmPayment', { token, ...data }),
  getOrders: (token, filters = {}) => apiCall('getOrders', { token, ...filters }),
  getSettings: (token) => apiCall('getSettings', { token }),
  updateSettings: (token, settings) => apiCall('updateSettings', { token, settings }),
  getPricingDefaults: (token) => apiCall('getPricingDefaults', { token })
};

// Auth helpers (localStorage)
const Auth = {
  getToken() {
    return localStorage.getItem('cs_admin_token');
  },
  setToken(token) {
    localStorage.setItem('cs_admin_token', token);
  },
  clear() {
    localStorage.removeItem('cs_admin_token');
    localStorage.removeItem('cs_admin_email');
  },
  getEmail() {
    return localStorage.getItem('cs_admin_email');
  },
  setEmail(email) {
    localStorage.setItem('cs_admin_email', email);
  },
  async requireAuth() {
    const token = this.getToken();
    if (!token) {
      window.location.href = 'login.html';
      return false;
    }
    const res = await API.adminValidate(token);
    if (!res.valid) {
      this.clear();
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};

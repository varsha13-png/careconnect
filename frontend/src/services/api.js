import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL ? `${process.env.REACT_APP_API_URL}/api` : 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('cc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('cc_token');
      localStorage.removeItem('cc_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────
export const loginUser = (data) => API.post('/auth/login', data);
export const loginDonor = (data) => API.post('/auth/login/donor', data);
export const registerDonor = (data) => API.post('/auth/register/donor', data);
export const registerHome = (data) => API.post('/auth/register/home', data);
export const acceptInvite = (data) => API.post('/auth/invite/accept', data);
export const getMe = () => API.get('/auth/me');

// ─── Homes ─────────────────────────────────────────
export const browseHomes = (params) => API.get('/homes/browse', { params });
export const getHome = (homeId) => API.get(`/homes/${homeId}`);
export const getDashboard = (homeId) => API.get(`/homes/${homeId}/dashboard`);
export const updatePaymentSettings = (homeId, data) => API.put(`/homes/${homeId}/payment-settings`, data);
export const updateVisibility = (homeId, data) => API.put(`/homes/${homeId}/visibility`, data);
export const inviteWorker = (homeId, data) => API.post(`/homes/${homeId}/invite-worker`, data);
export const getWorkers = (homeId) => API.get(`/homes/${homeId}/workers`);

// ─── Members ───────────────────────────────────────
export const getMembers = (homeId) => API.get(`/members/${homeId}`);
export const getMember = (homeId, memberId) => API.get(`/members/${homeId}/${memberId}`);
export const createMember = (homeId, data) => API.post(`/members/${homeId}`, data);
export const updateMember = (homeId, memberId, data) => API.put(`/members/${homeId}/${memberId}`, data);
export const dischargeMember = (homeId, memberId) => API.delete(`/members/${homeId}/${memberId}`);

// ─── Alerts ────────────────────────────────────────
export const getAlerts = (homeId, params) => API.get(`/alerts/${homeId}`, { params });
export const createAlert = (homeId, data) => API.post(`/alerts/${homeId}`, data);
export const markAlertDone = (homeId, alertId) => API.put(`/alerts/${homeId}/${alertId}/done`);
export const snoozeAlert = (homeId, alertId) => API.put(`/alerts/${homeId}/${alertId}/snooze`);
export const rejectAlert = (homeId, alertId, data) => API.put(`/alerts/${homeId}/${alertId}/reject`, data);
export const deleteAlert = (homeId, alertId) => API.delete(`/alerts/${homeId}/${alertId}`);

// ─── Needs ─────────────────────────────────────────
export const getPublicNeeds = (params) => API.get('/needs/public', { params });
export const getHomeNeeds = (homeId) => API.get(`/needs/${homeId}`);
export const createNeed = (homeId, data) => API.post(`/needs/${homeId}`, data);
export const updateNeed = (homeId, needId, data) => API.put(`/needs/${homeId}/${needId}`, data);

// ─── Donations ─────────────────────────────────────
export const createDonation = (needId, data) => API.post(`/needs/donate/${needId}`, data);
export const getHomeDonations = (homeId) => API.get(`/needs/donations/${homeId}`);
export const confirmDonation = (donationId) => API.put(`/needs/donations/${donationId}/confirm`);
export const sendThanks = (donationId, data) => API.put(`/needs/donations/${donationId}/thanks`, data);
export const getMyDonations = () => API.get('/needs/donations/my/history');

export default API;

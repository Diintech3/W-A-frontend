import { api } from './api';

export const dripService = {
  list: (params) => api.get('/drip-campaigns', { params }),
  get: (id) => api.get(`/drip-campaigns/${id}`),
  createManual: (body) => api.post('/drip-campaigns/manual', body),
  generateAi: (body) => api.post('/drip-campaigns/ai-generate', body),
  duplicate: (id) => api.post(`/drip-campaigns/${id}/duplicate`),
  update: (id, body) => api.put(`/drip-campaigns/${id}`, body),
  updateStep: (id, stepId, body) => api.put(`/drip-campaigns/${id}/step/${stepId}`, body),
  activate: (id) => api.post(`/drip-campaigns/${id}/activate`),
  pause: (id) => api.post(`/drip-campaigns/${id}/pause`),
  resume: (id) => api.post(`/drip-campaigns/${id}/resume`),
  stop: (id) => api.post(`/drip-campaigns/${id}/stop`),
  delete: (id) => api.delete(`/drip-campaigns/${id}`),
  getAnalytics: (id) => api.get(`/drip-campaigns/${id}/analytics`),
  getEnrollments: (id, params) => api.get(`/drip-campaigns/${id}/enrollments`, { params }),
  toggleEnrollmentStatus: (id, enrollmentId, status) =>
    api.patch(`/drip-campaigns/${id}/enrollments/${enrollmentId}`, { status }),
  testSendStep: (id, stepId, body) => api.post(`/drip-campaigns/${id}/test-step/${stepId}`, body),
  dispatchEnrollmentNow: (id, enrollmentId) =>
    api.post(`/drip-campaigns/${id}/enrollments/${enrollmentId}/dispatch-now`),
  dispatchDueSteps: (id, data) => api.post(`/drip-campaigns/${id}/dispatch-due`, data),
  retryFailed: (id) => api.post(`/drip-campaigns/${id}/retry-failed`),
};

export default dripService;

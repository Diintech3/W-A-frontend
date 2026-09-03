import axios from 'axios'

/** In dev, call the API server directly so requests work even if the Vite proxy misroutes. */
export function getApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  if (import.meta.env.DEV) return 'http://localhost:5005/api'
  return '/api'
}

const api = axios.create({
  baseURL: getApiBase(),
  withCredentials: true,
  headers: { 
    'Content-Type': 'application/json',
    'x-api-key': import.meta.env.VITE_WHATS_AI_API_KEY || 'whatsai-core-master-secret-key-2026',
  },
})

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = null

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    const url = original?.url || ''
    if (
      error.response?.status === 401 &&
      !original?._retry &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/register') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true
      try {
        if (!refreshing) {
          refreshing = axios
            .post(
              `${getApiBase()}/auth/refresh`,
              {},
              {
                withCredentials: true,
                headers: {
                  'x-api-key': import.meta.env.VITE_WHATS_AI_API_KEY || 'whatsai-core-master-secret-key-2026',
                },
              }
            )
            .finally(() => {
              refreshing = null
            })
        }
        const { data } = await refreshing
        if (data?.success && data.data?.accessToken) {
          if (sessionStorage.getItem('accessToken')) {
            sessionStorage.setItem('accessToken', data.data.accessToken)
          } else {
            localStorage.setItem('accessToken', data.data.accessToken)
          }
          original.headers.Authorization = `Bearer ${data.data.accessToken}`
          return api(original)
        }
      } catch {
        sessionStorage.removeItem('accessToken')
        localStorage.removeItem('accessToken')
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  connectWhatsApp: (body) => api.post('/whatsapp/connect', body),
  saveAIAgentId: (body) => api.post('/whatsapp/agent', body),
  getAIAgentId: () => api.get('/whatsapp/agent'),
  impersonate: (body) => api.post('/auth/impersonate', body),
  apiSharingLogin: (body) => api.post('/auth/api-sharing-login', body),
}

export const contactsApi = {
  list: (params) => api.get('/contacts', { params }),
  create: (body) => api.post('/contacts', body),
  update: (id, body) => api.patch(`/contacts/${id}`, body),
  remove: (id) => api.delete(`/contacts/${id}`),
  importCsv: (formData) =>
    api.post('/contacts/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  groups: () => api.get('/contacts/groups'),
  createGroup: (body) => api.post('/contacts/groups', body),
  deleteGroup: (id) => api.delete(`/contacts/groups/${id}`),
}

export const templatesApi = {
  // Client: apni assigned templates
  list: () => api.get('/templates'),
  get: (id) => api.get(`/templates/${id}`),
  create: (body) => api.post('/templates', body),
  update: (id, body) => api.patch(`/templates/${id}`, body),
  uploadMedia: (formData) =>
    api.post('/templates/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  submitToAdmin: (id) => api.post(`/templates/${id}/submit-to-admin`),
  remove: (id) => api.delete(`/templates/${id}`),
  // Meta verify (client bhi use kar sakta hai)
  metaVerify: (name, clientId) => api.post('/templates/meta/verify', { name, clientId }),
  // Admin only
  metaList: (clientId) => api.get('/templates/meta/list', { params: { clientId } }),
  metaSync: (clientId) => api.post('/templates/meta/sync', { clientId }),
  // Admin: client ke liye template management
  adminListClientTemplates: (clientId) => api.get(`/templates/admin/clients/${clientId}`),
  adminCreateOnMeta: (clientId, body) => api.post(`/templates/admin/clients/${clientId}/create-on-meta`, body),
  adminAssign: (clientId, body) => api.post(`/templates/admin/clients/${clientId}/assign`, body),
  adminRefreshAll: (clientId) => api.post(`/templates/admin/clients/${clientId}/refresh-all`),
  adminUpdate: (templateId, body) => api.patch(`/templates/admin/${templateId}`, body),
  adminDelete: (templateId) => api.delete(`/templates/admin/${templateId}`),
  adminRefreshStatus: (templateId) => api.post(`/templates/admin/${templateId}/refresh-status`),
  adminApproveAndSubmit: (templateId) => api.post(`/templates/admin/${templateId}/approve-and-submit`),
  adminDirectApprove: (templateId) => api.post(`/templates/admin/${templateId}/direct-approve`),
}

export const campaignsApi = {
  list: () => api.get('/campaigns'),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (body) => api.post('/campaigns', body),
  update: (id, body) => api.patch(`/campaigns/${id}`, body),
  send: (id) => api.post(`/campaigns/${id}/send`),
  remove: (id) => api.delete(`/campaigns/${id}`),
}

export const messagesApi = {
  list: (params) => api.get('/messages', { params }),
}

export const botApi = {
  getFlow: () => api.get('/bot/flow'),
  saveFlow: (body) => api.post('/bot/flow', body),
}

export const inboxApi = {
  conversations: () => api.get('/inbox/conversations'),
  messages: (id) => api.get(`/inbox/conversations/${id}/messages`),
  reply: (id, body) => api.post(`/inbox/conversations/${id}/reply`, body),
  assign: (id, body) => api.patch(`/inbox/conversations/${id}/assign`, body),
  toggleAi: (id, body) => api.put(`/inbox/conversations/${id}/toggle-ai`, body),
}

export const analyticsApi = {
  overview: () => api.get('/analytics/overview'),
  campaigns: () => api.get('/analytics/campaigns'),
  drip: () => api.get('/analytics/drip'),
  timeline: () => api.get('/analytics/timeline'),
}

export const superadminApi = {
  stats: () => api.get('/superadmin/stats'),
  listAdmins: () => api.get('/superadmin/admins'),
  createAdmin: (body) => api.post('/superadmin/admins', body),
  updateAdmin: (id, body) => api.put(`/superadmin/admins/${id}`, body),
  deleteAdmin: (id) => api.delete(`/superadmin/admins/${id}`),
  generateApiSharing: (id) => api.post(`/superadmin/admins/${id}/api-sharing`),
  revokeApiSharing: (id) => api.delete(`/superadmin/admins/${id}/api-sharing`),
  listClients: () => api.get('/superadmin/clients'),
  updateClient: (id, body) => api.put(`/superadmin/clients/${id}`, body),
  deleteClient: (id) => api.delete(`/superadmin/clients/${id}`),
  generateClientApiSharing: (id) => api.post(`/superadmin/clients/${id}/api-sharing`),
  revokeClientApiSharing: (id) => api.delete(`/superadmin/clients/${id}/api-sharing`),
}

export const adminApi = {
  stats: () => api.get('/admin/stats'),
  listClients: () => api.get('/admin/clients'),
  createClient: (body) => api.post('/admin/clients', body),
  updateClient: (id, body) => api.put(`/admin/clients/${id}`, body),
  deleteClient: (id) => api.delete(`/admin/clients/${id}`),
  generateClientApiSharing: (id) => api.post(`/admin/clients/${id}/api-sharing`),
  revokeClientApiSharing: (id) => api.delete(`/admin/clients/${id}/api-sharing`),
  generateSelfSharing: () => api.post('/admin/self-api-sharing'),
  revokeSelfSharing: () => api.delete('/admin/self-api-sharing'),
}

export const photoshareApi = {
  createFolder: (body) => api.post('/photoshare/folders', body),
  listFolders: () => api.get('/photoshare/folders'),
  getFolderDetails: (id) => api.get(`/photoshare/folders/${id}`),
  updateFolder: (id, body) => api.patch(`/photoshare/folders/${id}`, body),
  deleteFolder: (id) => api.delete(`/photoshare/folders/${id}`),
  getFolderPhotos: (id) => api.get(`/photoshare/folders/${id}/photos`),
  getPublicFolderDetails: (linkCode) => api.get(`/photoshare/public/folders/${linkCode}`),
  getPublicFolderPhotos: (linkCode) => api.get(`/photoshare/public/folders/${linkCode}/photos`),
  searchPhotosBySelfie: (linkCode, formData) =>
    api.post(`/photoshare/public/folders/${linkCode}/selfie-search`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}

export const dripApi = {
  list: (params) => api.get('/drip-campaigns', { params }),
  get: (id) => api.get(`/drip-campaigns/${id}`),
  createManual: (body) => api.post('/drip-campaigns/manual', body),
  generateAi: (body) => api.post('/drip-campaigns/ai-generate', body),
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
}

export { api }
export default api

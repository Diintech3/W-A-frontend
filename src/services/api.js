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
  // Meta verify (client bhi use kar sakta hai)
  metaVerify: (name) => api.post('/templates/meta/verify', { name }),
  // Admin only
  metaList: () => api.get('/templates/meta/list'),
  metaSync: () => api.post('/templates/meta/sync'),
  // Admin: client ke liye template management
  adminListClientTemplates: (clientId) => api.get(`/templates/admin/clients/${clientId}`),
  adminCreateOnMeta: (clientId, body) => api.post(`/templates/admin/clients/${clientId}/create-on-meta`, body),
  adminAssign: (clientId, body) => api.post(`/templates/admin/clients/${clientId}/assign`, body),
  adminRefreshAll: (clientId) => api.post(`/templates/admin/clients/${clientId}/refresh-all`),
  adminUpdate: (templateId, body) => api.patch(`/templates/admin/${templateId}`, body),
  adminDelete: (templateId) => api.delete(`/templates/admin/${templateId}`),
  adminRefreshStatus: (templateId) => api.post(`/templates/admin/${templateId}/refresh-status`),
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
}

export default api

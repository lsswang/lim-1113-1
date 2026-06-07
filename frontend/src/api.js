import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const getConfig = () => api.get('/config').then(r => r.data);

export const getApplications = (tenantId) => {
  const params = tenantId ? { tenant_id: tenantId } : {};
  return api.get('/applications', { params }).then(r => r.data);
};

export const getApplication = (id) => 
  api.get(`/applications/${id}`).then(r => r.data);

export const createApplication = (data) => 
  api.post('/applications', data).then(r => r.data);

export const submitApplication = (id, data) => 
  api.post(`/applications/${id}/submit`, data).then(r => r.data);

export const reviewApplication = (id, data) => 
  api.post(`/applications/${id}/review`, data).then(r => r.data);

export const issuePermit = (id, data) => 
  api.post(`/applications/${id}/issue-permit`, data).then(r => r.data);

export const uploadDrawing = (applicationId, file, type) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return api.post(`/applications/${applicationId}/drawings`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data);
};

export const deleteDrawing = (drawingId) => 
  api.delete(`/applications/drawings/${drawingId}`).then(r => r.data);

export const getUsers = (role) => {
  const params = role ? { role } : {};
  return api.get('/users', { params }).then(r => r.data);
};

export const getTenants = () => 
  api.get('/users/tenants/list').then(r => r.data);

export default api;

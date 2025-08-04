import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
};

// Folder API
export const folderAPI = {
  getMainFolders: () => api.get('/folders/main'),
  getFolderContents: (folderId) => api.get(`/folders/main/${folderId}/contents`),
  createFolder: (folderData) => api.post('/folders', folderData),
  createSubfolder: (parentId, subfolderData) => 
    api.post(`/folders/${parentId}/subfolder`, subfolderData),
  uploadFiles: (folderId, formData) => {
    return api.post(`/folders/${folderId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile: (folderId, fileId) => 
    api.delete(`/folders/${folderId}/file/${fileId}`),
  deleteFolder: (folderId) => api.delete(`/folders/${folderId}`),
  search: (query) => api.get(`/folders/search?q=${encodeURIComponent(query)}`),
  getFileById: (folderId, fileId) => 
    api.get(`/folders/${folderId}/file/${fileId}`),
  getFileContent: (folderId, fileId) => 
    api.get(`/folders/${folderId}/file/${fileId}`, {
      responseType: 'arraybuffer'
    }),
  getFilesInFolder: (folderId) => api.get(`/folders/${folderId}/files`),
  
  // Nouvelles fonctionnalités
  updateFileMetadata: (folderId, fileId, metadata) => 
    api.put(`/folders/${folderId}/file/${fileId}`, metadata),
  renameFolder: (folderId, name) => 
    api.put(`/folders/${folderId}`, { name }),
  getAllFiles: () => api.get('/folders/admin/all-files'),
  
  // Système de partage
  getUsers: () => api.get('/folders/users'),
  shareFolder: (folderId, recipientId, password) => 
    api.post(`/folders/${folderId}/share`, { recipientId, password }),
  respondToShare: (folderId, response) => 
    api.post(`/folders/${folderId}/respond`, { response }),
  getSharedFolders: () => api.get('/folders/shared/accepted'),

  // File sharing methods
  shareFile: (folderId, fileId, recipientId, password) =>
    api.post(`/folders/${folderId}/file/${fileId}/share`, {
      recipientId,
      password,
    }),

  respondToFileShare: (folderId, fileId, response) =>
    api.post(`/folders/${folderId}/file/${fileId}/respond`, {
      response,
    }),

  getSharedFiles: () => api.get("/folders/shared/files"),
};

export default api; 
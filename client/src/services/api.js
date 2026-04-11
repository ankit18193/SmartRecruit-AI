import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});


API.interceptors.request.use(
  (req) => {
    const token = localStorage.getItem('token');
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => {
    return Promise.reject(error);
  }
);


API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Unauthorized - Token expired or invalid");
      
      
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);



export const getJobs = () => API.get("/jobs");

export const fetchJobs = () => API.get('/jobs'); 


export const fetchMyJobs = () => API.get('/jobs/my-jobs');

export const deleteJob = (jobId) => API.delete(`/jobs/${jobId}`);



export const getApplications = (jobId) => {
  if (jobId) {
    
    return API.get(`/applications?jobId=${jobId}`);
  }
  return API.get(`/applications`);
};

export const updateApplicationStatus = (applicationId, status) => {
  return API.patch(`/applications/${applicationId}/status`, { status });
};

export const getApplicationById = (id) => {
  return API.get(`/applications/${id}`);
};

export const scheduleInterview = (id, data) => {
  return API.patch(`/applications/schedule/${id}`, data);
};



export const startInterview = (jobId) => {
  return API.post(`/interviews/start/${jobId}`);
};

export const submitInterview = (interviewId, answers) => {
  return API.post(`/interviews/submit/${interviewId}`, { answers });
};

export const getInterview = (jobId) => {
  return API.get(`/interviews/${jobId}`);
};

export const searchJobs = async (query) => {
  const res = await fetch(`/api/jobs/search?query=${query}`);
  return res.json();
};

export default API;
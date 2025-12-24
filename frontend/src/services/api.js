import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
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
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getProfile: () => api.get('/auth/profile'),
    updateProfile: (data) => api.put('/auth/profile', data),
    changePassword: (data) => api.put('/auth/password', data),
};

// Game API (legacy trivia)
export const gameAPI = {
    startGame: (options = {}) => api.post('/game/start', options),
    submitAnswer: (sessionId, data) => api.post(`/game/${sessionId}/answer`, data),
    endGame: (sessionId) => api.post(`/game/${sessionId}/end`),
    getStats: () => api.get('/game/stats'),
    getLeaderboard: (params = {}) => api.get('/game/leaderboard', { params }),
};

// SQL Quiz API (Multiple Choice / American Style)
export const sqlQuizAPI = {
    getChallenges: (params = {}) => api.get('/sql/quiz/challenges', { params }),
    startGame: (params = {}) => api.get('/sql/quiz/start', { params }),
    submitAnswer: (id, answer) => api.post(`/sql/quiz/${id}/submit`, { answer }),
};

// SQL Query API (Write Your Own SQL)
export const sqlQueryAPI = {
    getChallenges: (params = {}) => api.get('/sql/query/challenges', { params }),
    getChallenge: (id) => api.get(`/sql/query/challenges/${id}`),
    submitQuery: (id, query) => api.post(`/sql/query/${id}/submit`, { query }),
    executeQuery: (query) => api.post('/sql/query/execute', { query }),
};

// SQL Shared API
export const sqlAPI = {
    getSchema: () => api.get('/sql/schema'),
    getLeaderboard: () => api.get('/sql/leaderboard'),
};

// Questions API
export const questionsAPI = {
    getQuestions: (params = {}) => api.get('/questions', { params }),
    getCategories: () => api.get('/questions/categories'),
    getDifficulties: () => api.get('/questions/difficulties'),
};

// Health API
export const healthAPI = {
    check: () => api.get('/health'),
};

export default api;

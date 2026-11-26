import axios from 'axios';
import { API_BASE } from '../config';
const api = axios.create({ baseURL: API_BASE, timeout: 12000, withCredentials: true });
export async function signupAccount(payload) { return (await api.post('/auth/signup', payload)).data.data; }
export async function loginAccount(payload) { return (await api.post('/auth/login', payload)).data.data; }
export async function logoutAccount() { return (await api.post('/auth/logout')).data.data; }
export async function fetchCurrentUser() { return (await api.get('/auth/me')).data.data.user; }
export async function updateAccountProfile(payload) { return (await api.patch('/auth/profile', payload)).data.data.user; }
export async function requestPasswordReset(email) { return (await api.post('/auth/forgot-password', { email })).data.data; }
export async function resetAccountPassword(payload) { return (await api.post('/auth/reset-password', payload)).data.data; }
export async function fetchOverview() { return (await api.get('/overview')).data.data; }
export async function fetchSessions(params) { return (await api.get('/sessions', { params })).data.data; }
export async function fetchSessionEvents(id, params) { return (await api.get(`/sessions/${encodeURIComponent(id)}/events`, { params })).data.data; }
export async function fetchHeatmap(pageUrl) { return (await api.get('/heatmap', { params: pageUrl ? { page_url: pageUrl } : {} })).data.data; }
export async function fetchHealth() { return (await api.get('/health')).data.data; }

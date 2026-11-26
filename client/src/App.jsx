import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Overview from './pages/Overview';
import Sessions from './pages/Sessions';
import SessionDetail from './pages/SessionDetail';
import Heatmap from './pages/Heatmap';
import AccountSettings from './pages/AccountSettings';
import { ForgotPasswordPage, LoginPage, ResetPasswordPage, SignupPage } from './pages/AuthPages';
import { AuthProvider, useAuth } from './auth/AuthContext';

function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <main className="auth-loading"><span className="spinner"/>Checking your account…</main>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
  return <Outlet/>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage/>}/>
    <Route path="/signup" element={<SignupPage/>}/>
    <Route path="/forgot-password" element={<ForgotPasswordPage/>}/>
    <Route path="/reset-password" element={<ResetPasswordPage/>}/>
    <Route element={<RequireAuth/>}><Route element={<AppLayout/>}>
      <Route index element={<Overview/>}/>
      <Route path="sessions" element={<Sessions/>}/>
      <Route path="sessions/:sessionId" element={<SessionDetail/>}/>
      <Route path="heatmap" element={<Heatmap/>}/>
      <Route path="settings" element={<AccountSettings/>}/>
      <Route path="*" element={<main className="not-found"><h1>Page not found</h1><a href="/">Back to overview</a></main>}/>
    </Route></Route>
  </Routes></BrowserRouter></AuthProvider>;
}

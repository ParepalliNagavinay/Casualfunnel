import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { requestPasswordReset, resetAccountPassword } from '../services/api';
import { useAuth } from '../auth/AuthContext';

function AuthFrame({ eyebrow, title, description, children, footer }) {
  const brand = (import.meta.env.VITE_BRAND_NAME || 'InsightFlow').trim();
  return <main className="auth-page"><section className="auth-story"><Link to="/login" className="auth-brand"><span><Activity size={19}/></span>{brand}</Link><div className="auth-story-copy"><div className="auth-story-label"><i/> PRIVATE ANALYTICS WORKSPACE</div><h1>Clarity for every<br/>customer journey.</h1><p>Understand how visitors experience your website, from their first page view to the clicks that matter.</p><div className="auth-story-foot"><ShieldCheck size={15}/> Your analytics workspace is private to your account.</div></div><div className="auth-story-index">INSIGHTFLOW · USER ANALYTICS</div></section><section className="auth-panel"><div className="auth-card"><div className="auth-mobile-brand"><span><Activity size={18}/></span>{brand}</div><div className="auth-eyebrow">{eyebrow}</div><h2>{title}</h2><p className="auth-description">{description}</p>{children}<div className="auth-footer">{footer}</div></div><div className="auth-legal">Secure account access <span>·</span> InsightFlow</div></section></main>;
}

function AuthError({ children }) { return children ? <div className="auth-message error" role="alert">{children}</div> : null; }
function AuthSuccess({ children }) { return children ? <div className="auth-message success" role="status">{children}</div> : null; }
function InputField({ label, type = 'text', name, value, onChange, placeholder, autoComplete, required = true, minLength, icon }) {
  const Icon = icon;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return <label className="auth-field"><span>{label}</span><div className="auth-input-wrap">{Icon && <Icon size={15}/>}<input type={isPassword && visible ? 'text' : type} name={name} value={value} onChange={onChange} placeholder={placeholder} autoComplete={autoComplete} required={required} minLength={minLength}/>{isPassword && <button className="password-visibility" type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} title={visible ? 'Hide password' : 'Show password'}>{visible ? <EyeOff size={16}/> : <Eye size={16}/>}</button>}</div></label>;
}
function AuthSubmit({ busy, children }) { return <button className="auth-submit" type="submit" disabled={busy}>{busy ? 'Please wait…' : children}<ArrowRight size={15}/></button>; }

export function LoginPage() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const notice = location.state?.notice || '';
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace/>;
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await login(form); navigate('/', { replace: true }); }
    catch (e) { setError(e.response?.data?.error?.message || 'We couldn’t sign you in. Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <AuthFrame eyebrow="WELCOME BACK" title="Sign in to InsightFlow" description="Enter your account details to open your analytics workspace." footer={<>New to InsightFlow? <Link to="/signup">Create an account</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <AuthSuccess>{notice}</AuthSuccess><AuthError>{error}</AuthError>
      <InputField label="Email address" type="email" name="email" value={form.email} onChange={update} placeholder="you@company.com" autoComplete="email" icon={Mail}/>
      <InputField label="Password" type="password" name="password" value={form.password} onChange={update} placeholder="Your password" autoComplete="current-password" icon={LockKeyhole}/>
      <div className="auth-inline-link"><Link to="/forgot-password">Forgot password?</Link></div>
      <AuthSubmit busy={busy}>Sign in</AuthSubmit>
    </form>
  </AuthFrame>;
}

export function SignupPage() {
  const { user, signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace/>;
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try { await signup(form); navigate('/', { replace: true }); }
    catch (e) { setError(e.response?.data?.error?.message || 'We couldn’t create your account. Please try again.'); }
    finally { setBusy(false); }
  }
  return <AuthFrame eyebrow="GET STARTED" title="Create your account" description="Set up your private workspace. Your analytics will be kept separate from other accounts." footer={<>Already have an account? <Link to="/login">Sign in</Link></>}>
    <form className="auth-form" onSubmit={submit}>
      <AuthError>{error}</AuthError>
      <InputField label="Full name" name="name" value={form.name} onChange={update} placeholder="Jordan Davis" autoComplete="name" minLength={2}/>
      <InputField label="Email address" type="email" name="email" value={form.email} onChange={update} placeholder="you@company.com" autoComplete="email" icon={Mail}/>
      <InputField label="Password" type="password" name="password" value={form.password} onChange={update} placeholder="At least 12 characters" autoComplete="new-password" minLength={12} icon={LockKeyhole}/>
      <p className="password-hint">Use 12–128 characters. Your password is stored as a one-way hash.</p>
      <AuthSubmit busy={busy}>Create account</AuthSubmit>
    </form>
  </AuthFrame>;
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setError('');
    try { const result = await requestPasswordReset(email); setMessage(result.message); }
    catch (e) { setError(e.response?.data?.error?.message || 'We couldn’t process that request. Please try again.'); }
    finally { setBusy(false); }
  }
  return <AuthFrame eyebrow="ACCOUNT RECOVERY" title="Reset your password" description="Enter the email address associated with your account. We’ll send reset instructions if it exists." footer={<Link className="back-to-login" to="/login"><ArrowLeft size={14}/> Back to sign in</Link>}>
    <form className="auth-form" onSubmit={submit}>
      <AuthError>{error}</AuthError><AuthSuccess>{message}</AuthSuccess>
      <InputField label="Email address" type="email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" icon={Mail}/>
      <AuthSubmit busy={busy}>Send reset instructions</AuthSubmit>
      {message && import.meta.env.DEV && <p className="reset-dev-note">In local development, the reset link is printed in the backend terminal when SMTP is not configured.</p>}
    </form>
  </AuthFrame>;
}

export function ResetPasswordPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const token = search.get('token') || '';
  useEffect(() => { if (!token) setError('This reset link is missing its token. Request a new password reset link.'); }, [token]);
  function update(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  async function submit(event) {
    event.preventDefault(); setError('');
    if (form.password !== form.confirm) { setError('The passwords do not match.'); return; }
    setBusy(true);
    try { await resetAccountPassword({ token, password: form.password }); navigate('/login', { replace: true, state: { notice: 'Password updated. Sign in with your new password.' } }); }
    catch (e) { setError(e.response?.data?.error?.message || 'We couldn’t reset your password. Request a new link and try again.'); }
    finally { setBusy(false); }
  }
  return <AuthFrame eyebrow="CHOOSE A NEW PASSWORD" title="Set a new password" description="Reset links expire after 30 minutes. Choose a password you haven’t used here before." footer={<Link className="back-to-login" to="/login"><ArrowLeft size={14}/> Back to sign in</Link>}>
    <form className="auth-form" onSubmit={submit}>
      <AuthError>{error}</AuthError>
      <InputField label="New password" type="password" name="password" value={form.password} onChange={update} placeholder="At least 12 characters" autoComplete="new-password" minLength={12} icon={LockKeyhole}/>
      <InputField label="Confirm new password" type="password" name="confirm" value={form.confirm} onChange={update} placeholder="Enter it again" autoComplete="new-password" minLength={12} icon={LockKeyhole}/>
      <AuthSubmit busy={busy}>Update password</AuthSubmit>
    </form>
  </AuthFrame>;
}

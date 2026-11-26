import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Eye, EyeOff, KeyRound, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { updateAccountProfile } from '../services/api';
import { API_BASE, TRACKER_URL, demoUrlForTracker } from '../config';

function messageFrom(error, fallback) { return error.response?.data?.error?.message || fallback; }

export default function AccountSettings() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setName(user.name), [user.name]);
  const demoUrl = useMemo(() => demoUrlForTracker(user.tracker_id), [user.tracker_id]);
  const snippet = `<script src="${TRACKER_URL}" data-api-url="${API_BASE.replace(/\/$/, '')}/events" data-site-id="${user.tracker_id}" defer></script>`;

  async function saveProfile(event) {
    event.preventDefault(); setProfileBusy(true); setProfileMessage(''); setProfileError('');
    try { const updated = await updateAccountProfile({ name }); setUser(updated); setProfileMessage('Your name was updated.'); }
    catch (error) { setProfileError(messageFrom(error, 'We couldn’t update your profile.')); }
    finally { setProfileBusy(false); }
  }
  async function changePassword(event) {
    event.preventDefault(); setPasswordBusy(true); setPasswordMessage(''); setPasswordError('');
    try {
      const updated = await updateAccountProfile({ name: user.name, ...passwords });
      setUser(updated); setPasswords({ current_password: '', new_password: '' }); setPasswordMessage('Your password was changed.');
    } catch (error) { setPasswordError(messageFrom(error, 'We couldn’t change your password.')); }
    finally { setPasswordBusy(false); }
  }
  async function copySnippet() {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setProfileError('Clipboard access is unavailable. Select and copy the tracker snippet manually.'); }
  }

  return <>
    <div className="page-heading"><div><div className="eyebrow-label">WORKSPACE / ACCOUNT</div><h1>Account settings</h1><p>Manage your sign-in details and website tracking setup.</p></div></div>
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="settings-panel-heading"><span className="settings-icon"><UserRound size={17}/></span><div><h2>Profile</h2><p>Update the details for your InsightFlow account.</p></div></div>
        <form className="settings-form" onSubmit={saveProfile}>
          {profileError && <div className="settings-form-error" role="alert">{profileError}</div>}{profileMessage && <div className="settings-success" role="status"><Check size={14}/>{profileMessage}</div>}
          <label className="settings-field"><span>Full name</span><input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} required autoComplete="name"/></label>
          <label className="settings-field"><span>Email address</span><div className="readonly-input"><Mail size={15}/><input value={user.email} readOnly aria-label="Account email address"/><span>Used for sign-in and recovery</span></div></label>
          <button className="settings-submit" type="submit" disabled={profileBusy || name.trim() === user.name}>{profileBusy ? 'Saving…' : 'Save profile'}</button>
        </form>
      </section>
      <section className="panel settings-panel"><div className="settings-panel-heading"><span className="settings-icon"><KeyRound size={17}/></span><div><h2>Password</h2><p>Choose a unique password with at least 12 characters.</p></div></div>
        <form className="settings-form" onSubmit={changePassword}>
          {passwordError && <div className="settings-form-error" role="alert">{passwordError}</div>}{passwordMessage && <div className="settings-success" role="status"><Check size={14}/>{passwordMessage}</div>}
          <label className="settings-field"><span>Current password</span><div className="settings-password-wrap"><input type={showCurrentPassword ? 'text' : 'password'} value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} autoComplete="current-password" required/><button className="password-visibility settings-password-visibility" type="button" onClick={() => setShowCurrentPassword(value => !value)} aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'} aria-pressed={showCurrentPassword} title={showCurrentPassword ? 'Hide password' : 'Show password'}>{showCurrentPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div></label>
          <label className="settings-field"><span>New password</span><div className="settings-password-wrap"><input type={showNewPassword ? 'text' : 'password'} value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} autoComplete="new-password" minLength={12} maxLength={128} required/><button className="password-visibility settings-password-visibility" type="button" onClick={() => setShowNewPassword(value => !value)} aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} aria-pressed={showNewPassword} title={showNewPassword ? 'Hide password' : 'Show password'}>{showNewPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</button></div></label>
          <button className="settings-submit" type="submit" disabled={passwordBusy}>{passwordBusy ? 'Updating…' : 'Update password'}</button>
        </form>
      </section>
      <section className="panel settings-panel tracker-settings"><div className="settings-panel-heading"><span className="settings-icon"><ShieldCheck size={17}/></span><div><h2>Website tracking</h2><p>This tracker ID routes event data into your private account.</p></div></div>
        <div className="tracker-id-row"><span>YOUR TRACKER ID</span><code>{user.tracker_id}</code></div>
        <label className="settings-field snippet-label"><span>Install this snippet on your website</span><textarea readOnly value={snippet} rows={3} onFocus={(e) => e.target.select()} aria-label="Website tracker script"/></label>
        <div className="tracker-actions"><button className="settings-submit" type="button" onClick={copySnippet}>{copied ? <><Check size={14}/> Copied</> : <><Copy size={14}/> Copy snippet</>}</button><a className="tracker-preview" href={demoUrl} target="_blank" rel="noreferrer">Try it on the demo store <span>↗</span></a></div>
        <p className="settings-note">Keep the <code>data-site-id</code> unchanged when installing the snippet. It is a public routing ID, not a password.</p>
      </section>
      <aside className="settings-security"><ShieldCheck size={16}/><p><strong>Private by account</strong><br/>Dashboard analytics are filtered to this account. Each account gets a separate tracker ID, so events from your website are stored in your own workspace.</p></aside>
    </div>
  </>;
}

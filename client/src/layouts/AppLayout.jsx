import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Activity, ArrowUpRight, BarChart3, ChevronDown, LayoutDashboard, LogOut, MousePointer2, Settings, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { fetchHealth } from '../services/api';
import { demoUrlForTracker } from '../config';

const nav = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/sessions', label: 'Sessions', icon: Users },
  { to: '/heatmap', label: 'Click heatmaps', icon: MousePointer2 }
];
function initials(name = '') { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'IF'; }

export default function AppLayout() {
  const brand = (import.meta.env.VITE_BRAND_NAME || 'InsightFlow').trim();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [apiReady, setApiReady] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef(null);
  useEffect(() => {
    let live = true;
    fetchHealth().then(() => { if (live) setApiReady(true); }).catch(() => { if (live) setApiReady(false); });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    function dismiss(event) { if (!accountMenuRef.current?.contains(event.target)) setAccountOpen(false); }
    function onKeyDown(event) { if (event.key === 'Escape') setAccountOpen(false); }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', onKeyDown); };
  }, []);
  async function signOut() { setAccountOpen(false); await logout(); navigate('/login', { replace: true }); }
  const demoUrl = demoUrlForTracker(user.tracker_id);

  return <div className="app-shell">
    <aside className="sidebar">
      <Link to="/" className="logo"><span className="logo-mark"><Activity size={18}/></span><span>{brand}</span></Link>
      <div className="workspace"><span className="workspace-badge">{initials(user.name).slice(0, 1)}</span><span className="workspace-copy"><strong>{user.name}</strong><small>Private workspace</small></span></div>
      <p className="nav-label">ANALYTICS</p>
      <nav className="side-nav">{nav.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} title={label} aria-label={label} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom">
        <a className="nav-item" href={demoUrl} target="_blank" rel="noreferrer"><ArrowUpRight size={16}/><span>Open demo store</span></a>
        <div className="plan-card"><div className="plan-icon"><BarChart3 size={16}/></div><strong>Getting started</strong><p>Install your account tracker to start collecting private visitor activity.</p><NavLink to="/settings">Set up tracking <ArrowUpRight size={13}/></NavLink></div>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Settings size={16}/><span>Account settings</span></NavLink>
        <button type="button" className="nav-item logout-link" onClick={signOut}><LogOut size={16}/><span>Sign out</span></button>
      </div>
      <div className="profile"><span className="avatar">{initials(user.name)}</span><span><strong>{user.name}</strong><small>{user.email}</small></span></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>{user.name}</span><span className="slash">/</span><strong>Analytics</strong></div><div className="topbar-right"><span className={`live-dot ${apiReady === false ? 'offline' : apiReady === true ? 'online' : 'pending'}`}/><span className={`connected ${apiReady === false ? 'offline-text' : ''}`}>{apiReady === null ? 'Connecting…' : apiReady ? 'API connected' : 'API unavailable'}</span><span className="top-divider"/><span className="today">All time</span><div className="account-menu-wrap" ref={accountMenuRef}><button className={`account-menu-trigger ${accountOpen ? 'is-open' : ''}`} type="button" aria-label={`Account menu for ${user.name}`} aria-haspopup="true" aria-expanded={accountOpen} aria-controls={accountOpen ? 'account-popover' : undefined} onClick={() => setAccountOpen((open) => !open)}><span className="avatar small-avatar">{initials(user.name)}</span><ChevronDown size={14}/></button>{accountOpen && <section className="account-popover" id="account-popover" aria-label="Account details"><div className="account-popover-head"><div className="account-popover-avatar">{initials(user.name)}</div><div className="account-popover-identity"><strong>{user.name}</strong><span>{user.email}</span></div><span className="signed-in-pill"><i/>Signed in</span></div><div className="account-popover-meta"><div><span>Workspace</span><strong>Private analytics</strong></div><div><span>Tracker ID</span><code title={user.tracker_id}>{user.tracker_id}</code></div></div><div className="account-popover-actions"><Link to="/settings" onClick={() => setAccountOpen(false)}><Settings size={15}/><span><strong>Account settings</strong><small>Profile, password & tracking</small></span><ArrowUpRight size={14}/></Link><button type="button" onClick={signOut}><LogOut size={15}/><span>Sign out</span></button></div><div className="account-popover-foot"><ShieldCheck size={13}/> Your account data is private</div></section>}</div></div></header>
      <div className="page-content"><Outlet/></div>
    </main>
  </div>;
}

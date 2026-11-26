import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Overview from './pages/Overview';
import Sessions from './pages/Sessions';
import * as api from './services/api';

vi.mock('./services/api', () => ({ fetchOverview: vi.fn(), fetchSessions: vi.fn() }));
vi.mock('./auth/AuthContext', () => ({ useAuth: () => ({ user: { name: 'Test User', email: 'test@example.com', tracker_id: 'test-tracker-id' } }) }));
describe('analytics screens', () => {
  beforeEach(() => vi.clearAllMocks());
  it('renders a truthful empty overview when there is no collected activity', async () => {
    api.fetchOverview.mockResolvedValue({ total_sessions: 0, total_events: 0, page_views: 0, clicks: 0, daily: [], top_pages: [], recent: [] });
    render(<MemoryRouter><Overview/></MemoryRouter>);
    expect(await screen.findByText('Waiting for your first event')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(4);
  });
  it('renders the sessions empty state from the API response', async () => {
    api.fetchSessions.mockResolvedValue({ sessions: [], total: 0, page: 1, limit: 10 });
    render(<MemoryRouter><Sessions/></MemoryRouter>);
    expect(await screen.findByText('No sessions yet')).toBeInTheDocument();
  });
  it('shows a useful error when the sessions API is unavailable', async () => {
    api.fetchSessions.mockRejectedValue(new Error('offline'));
    render(<MemoryRouter><Sessions/></MemoryRouter>);
    expect(await screen.findByText('We couldn’t load this data.')).toBeInTheDocument();
  });
});

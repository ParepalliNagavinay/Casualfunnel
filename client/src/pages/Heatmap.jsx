import { useEffect, useMemo, useState } from 'react';
import { MousePointer2, Info, ExternalLink, MoveUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { fetchHeatmap } from '../services/api';
import { Empty, ErrorState, Loading } from '../components/State';

export default function Heatmap() {
  const [pages, setPages] = useState([]), [selected, setSelected] = useState('');
  const [data, setData] = useState(null), [busy, setBusy] = useState(true), [error, setError] = useState(''), [hover, setHover] = useState(null);
  useEffect(() => {
    let live = true;
    fetchHeatmap().then((result) => {
      if (!live) return;
      const urls = result.pages || [];
      setPages(urls);
      if (urls.length) setSelected(urls[0]); else { setData(result); setBusy(false); }
    }).catch((e) => { if (live) { setError(e.response?.data?.error?.message || 'Heatmap data could not be loaded.'); setBusy(false); } });
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!selected) return undefined;
    let live = true;
    setBusy(true); setError('');
    fetchHeatmap(selected).then((result) => { if (live) setData(result); })
      .catch((e) => { if (live) setError(e.response?.data?.error?.message || 'Heatmap data could not be loaded.'); })
      .finally(() => { if (live) setBusy(false); });
    return () => { live = false; };
  }, [selected]);
  const dots = useMemo(() => data?.clicks || [], [data]);
  const densities = useMemo(() => {
    const counts = new Map();
    dots.forEach((dot) => { const key = `${Math.floor(dot.x / (dot.viewport_width || 1) * 20)}:${Math.floor(dot.y / (dot.viewport_height || 1) * 20)}`; counts.set(key, (counts.get(key) || 0) + 1); });
    return counts;
  }, [dots]);
  return <>
    <div className="page-heading"><div><div className="eyebrow-label">ANALYTICS / INTERACTIONS</div><h1>Click heatmaps</h1><p>See where visitors are clicking across your pages.</p></div>{data && <div className="click-total"><span className="live-dot"/>{data.total_clicks} clicks</div>}</div>
    <section className="panel heatmap-panel">
      <div className="heatmap-toolbar"><div className="selector-wrap"><label htmlFor="page-select">PAGE</label><select id="page-select" value={selected} onChange={(e) => setSelected(e.target.value)} disabled={!pages.length}><option value="">{pages.length ? 'Select a page' : 'No pages with clicks'}</option>{pages.map((url) => <option value={url} key={url}>{url}</option>)}</select></div>{selected && <a className="open-page" href={selected} target="_blank" rel="noreferrer">Open page <ExternalLink size={13}/></a>}</div>
      {busy ? <Loading label="Loading click data"/> : error ? <ErrorState error={error}/> : !selected || !dots.length ? <Empty title="No click data for this page">Clicks will appear after a visitor interacts with a page that has the InsightFlow tracker installed.</Empty> : <>
        <div className="heatmap-note"><Info size={15}/><span>Each marker is positioned relative to the visitor’s recorded viewport. The preview is a neutral surface, not a screenshot of your page.{data.clicks_truncated ? ' Showing the latest 5,000 clicks; the total count includes all clicks.' : ''}</span></div>
        <div className="heatmap-stage"><div className="preview-label"><span>PAGE PREVIEW</span><span><MoveUpRight size={12}/> viewport-relative</span></div>
          <div className="preview-canvas" role="region" aria-label={`Click map with ${dots.length} recorded positions`}><div className="preview-watermark" aria-hidden="true"><MousePointer2 size={25}/><strong>Interaction map</strong><span>Normalized to each visitor’s viewport</span></div>
            {dots.map((click, index) => {
              const width = click.viewport_width || 1, height = click.viewport_height || 1;
              const x = Math.max(0, Math.min(100, click.x / width * 100)), y = Math.max(0, Math.min(100, click.y / height * 100));
              const bucket = `${Math.floor(click.x / width * 20)}:${Math.floor(click.y / height * 20)}`;
              const density = Math.min(3, densities.get(bucket) || 1);
              return <button key={`${click.session_id}-${click.timestamp}-${index}`} aria-label={`Click ${index + 1} at ${Math.round(x)} percent across, ${Math.round(y)} percent down`} className={`heat-dot density-${density}`} style={{ left: `${x}%`, top: `${y}%` }} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(index)} onBlur={() => setHover(null)}><span className="heat-core"/>{hover === index && <span className="heat-tooltip"><strong>Click position</strong><span>{Math.round(click.x)}, {Math.round(click.y)} px</span><span>Viewport {click.viewport_width} × {click.viewport_height}</span><span>{format(new Date(click.timestamp), 'MMM d, h:mm a')}</span></span>}</button>;
            })}
          </div>
        </div>
        <div className="heatmap-footer"><span><i className="legend-dot low"/> Fewer clicks <span className="legend-gradient"/> More clicks <i className="legend-dot high"/></span><span>{dots.length} positions · {densities.size} areas</span></div>
      </>}
    </section>
  </>;
}

import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const TPL = {
  dreamy: { name: '🌸 Dreamy Bloom', bg: ['#ffd1e8', '#d8b4fe'], ink: '#5b1a4a' },
  cinematic: { name: '🎬 Cinematic Night', bg: ['#1a0b2e', '#6b2b5c'], ink: '#ffffff' },
  romantic: { name: '🌹 Rose Gold Romance', bg: ['#f7cac9', '#b76e79'], ink: '#4a1c28' }
};
const W = 1280, H = 720;
const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function wrap(ctx, text, x, y, maxW, lh) {
  const lines = []; let line = '';
  for (const w of (text || '').split(/\s+/)) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  lines.push(line); lines.forEach((l, k) => ctx.fillText(l, x, y + k * lh));
}
async function draw(f, tpl) {
  await document.fonts.load('48px "Playfair Display"'); await document.fonts.load('80px "Great Vibes"');
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, tpl.bg[0]); g.addColorStop(1, tpl.bg[1]);
  x.fillStyle = g; x.fillRect(0, 0, W, H); x.textAlign = 'center';
  if (f.img) {
    const im = await loadImg(f.img);
    const s = Math.max(W / im.width, H / im.height);
    x.save(); x.filter = 'blur(28px) brightness(.75)';
    x.drawImage(im, (W - im.width * s) / 2, (H - im.height * s) / 2, im.width * s, im.height * s); x.restore();
    const s2 = Math.min((W - 140) / im.width, (H - 200) / im.height), w = im.width * s2, h = im.height * s2;
    x.fillStyle = '#fff'; x.fillRect((W - w) / 2 - 10, 20, w + 20, h + 20); x.drawImage(im, (W - w) / 2, 30, w, h);
    x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.7)'; x.shadowBlur = 12;
    x.font = 'italic 34px "Playfair Display"'; wrap(x, f.caption, W / 2, H - 100, 1000, 40);
    x.font = '22px Quicksand'; x.fillText(f.date || '', W / 2, H - 28);
  } else {
    x.fillStyle = tpl.ink; x.font = '110px "Great Vibes"'; wrap(x, f.title, W / 2, H / 2 - 30, 1050, 120);
    x.font = 'italic 34px "Playfair Display"'; wrap(x, f.sub, W / 2, H / 2 + 100, 950, 44);
    x.font = '60px serif'; x.fillText('❤', W / 2, H - 70);
  }
  return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.92));
}

export default function VideoMaker({ data }) {
  const [slides, setSlides] = useState([]);
  const [title, setTitle] = useState('Our Love Story');
  const [sub, setSub] = useState('A journey of every moment with you');
  const [end, setEnd] = useState('Forever yours ❤️');
  const [tpl, setTpl] = useState('dreamy');
  const [secs, setSecs] = useState(4);
  const [tracks, setTracks] = useState([]);
  const [music, setMusic] = useState('');
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState('');
  const [err, setErr] = useState('');
  const [prev, setPrev] = useState(null);
  const audio = useRef(null);

  useEffect(() => { api.music().then(setTracks).catch(() => {}); }, []);
  useEffect(() => {
    setSlides((s) => {
      const keep = s.filter((x) => data.photos.some((p) => p.id === x.pid));
      const add = data.photos.filter((p) => !s.some((x) => x.pid === p.id)).map((p) => ({ pid: p.id, caption: p.caption, date: p.date, on: true }));
      return [...keep, ...add];
    });
  }, [data.photos]);

  const url = (pid) => data.photos.find((p) => p.id === pid)?.url;
  const set = (i, k, v) => setSlides((s) => s.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const move = (i, d) => setSlides((s) => { const a = [...s], j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const frames = () => [{ title, sub }, ...slides.filter((s) => s.on).map((s) => ({ img: url(s.pid), caption: s.caption, date: s.date })), { title: end, sub: '' }];

  // preview
  useEffect(() => {
    if (prev === null) return;
    const n = frames().length;
    if (prev >= n) { setPrev(null); audio.current?.pause(); return; }
    const t = setTimeout(() => setPrev(prev + 1), secs * 1000);
    return () => clearTimeout(t);
  }, [prev]); // eslint-disable-line
  const startPrev = () => { setPrev(0); if (music && audio.current) { audio.current.currentTime = 0; audio.current.play().catch(() => {}); } };
  const cur = prev !== null ? frames()[prev] : null;
  const T = TPL[tpl];

  const uploadMusic = async (e) => { try { const [u] = await api.upload(e.target.files); setMusic(u); } catch (x) { setErr(x.message); } };
  const exportVideo = async () => {
    setErr(''); setResult(''); setBusy('Composing your frames…');
    try {
      const fd = new FormData();
      for (const f of frames()) fd.append('frames', await draw(f, T), 'f.jpg');
      fd.append('template', tpl); fd.append('seconds', secs); fd.append('musicUrl', music);
      setBusy('Rendering your MP4 with FFmpeg… this can take a minute ⏳');
      setResult((await api.video(fd)).url);
    } catch (e) { setErr(e.message); }
    setBusy('');
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="script text-5xl sm:text-6xl text-center gold-text mb-8">Turn Our Memories Into a Movie ❤️</h2>
      <div className="glass rounded-3xl p-5 sm:p-8 grid gap-6">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm font-semibold">Movie title<input className="inp" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
          <label className="text-sm font-semibold">Opening message<input className="inp" value={sub} onChange={(e) => setSub(e.target.value)} /></label>
          <label className="text-sm font-semibold">Closing message<input className="inp" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
        </div>
        <div>
          <p className="font-semibold mb-2">Template</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TPL).map(([k, v]) => <button key={k} onClick={() => setTpl(k)} className={`btn2 ${tpl === k ? '!bg-pink-500 !text-white' : ''}`}>{v.name}</button>)}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm font-semibold">Seconds per photo: {secs}
            <input type="range" min="2" max="10" value={secs} onChange={(e) => setSecs(+e.target.value)} className="w-full accent-pink-500" /></label>
          <label className="text-sm font-semibold">Background music
            <select className="inp" value={music} onChange={(e) => setMusic(e.target.value)}>
              <option value="">No music</option>
              {tracks.map((t) => <option key={t.url} value={t.url}>{t.name}</option>)}
              {music.startsWith('/uploads/') && <option value={music}>My uploaded song</option>}
            </select>
            <span className="text-xs font-normal opacity-70">Or </span>
            <label className="text-xs underline cursor-pointer">upload your own<input type="file" accept="audio/*" hidden onChange={uploadMusic} /></label>
          </label>
        </div>
        <div>
          <p className="font-semibold mb-2">Photos &amp; order ({slides.filter((s) => s.on).length} selected) — add photos in the Gallery above</p>
          <div className="grid gap-2 max-h-[420px] overflow-auto pr-1">
            {slides.map((s, i) => (
              <div key={s.pid} className="flex flex-wrap sm:flex-nowrap gap-2 items-center bg-white/60 rounded-xl p-2">
                <input type="checkbox" checked={s.on} onChange={(e) => set(i, 'on', e.target.checked)} className="accent-pink-500" />
                <img src={url(s.pid)} className="w-16 h-16 object-cover rounded-lg" alt="" />
                <input className="inp flex-1 min-w-[140px]" placeholder="Caption / personal message" value={s.caption} onChange={(e) => set(i, 'caption', e.target.value)} />
                <input className="inp !w-40" type="date" value={s.date} onChange={(e) => set(i, 'date', e.target.value)} />
                <button className="btn2" onClick={() => move(i, -1)}>↑</button><button className="btn2" onClick={() => move(i, 1)}>↓</button>
              </div>
            ))}
            {slides.length === 0 && <p className="opacity-70">Upload photos in the gallery first.</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn" onClick={startPrev} disabled={!slides.length}>▶ Preview</button>
          <button className="btn" onClick={exportVideo} disabled={!!busy || !slides.some((s) => s.on)}>🎬 Create &amp; Export MP4</button>
        </div>
        {music && <audio ref={audio} src={music} />}
        {busy && <div className="text-center"><div className="text-5xl heart-beat inline-block">❤️</div><p className="mt-2">{busy}</p></div>}
        {err && <p className="text-red-600 text-sm break-words">⚠ {err}</p>}
        {result && (
          <div className="text-center rise">
            <video src={result} controls className="w-full max-w-2xl mx-auto rounded-2xl shadow-xl" />
            <a href={result} download="our-love-story.mp4" className="btn inline-block mt-4">⬇ Download MP4</a>
          </div>
        )}
      </div>
      {cur && (
        <div className="fixed inset-0 z-50 grid place-items-center text-center overflow-hidden" style={{ background: `linear-gradient(135deg,${T.bg[0]},${T.bg[1]})` }}>
          {cur.img ? (
            <div key={prev} className="kenburns relative">
              <img src={cur.img} className="max-h-[75vh] max-w-[92vw] border-8 border-white shadow-2xl" alt="" />
              <p className="serif italic text-white text-2xl mt-4 drop-shadow-lg">{cur.caption}</p>
              <p className="text-white/80 text-sm">{cur.date}</p>
            </div>
          ) : (
            <div key={prev} className="kenburns px-6"><h3 className="script text-6xl sm:text-8xl" style={{ color: T.ink }}>{cur.title}</h3><p className="serif italic text-2xl mt-4" style={{ color: T.ink }}>{cur.sub}</p></div>
          )}
          <button className="btn2 absolute top-4 right-4" onClick={() => { setPrev(null); audio.current?.pause(); }}>✕ Stop</button>
        </div>
      )}
    </section>
  );
}

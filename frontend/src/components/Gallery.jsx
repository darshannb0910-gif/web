import { useEffect, useState } from 'react';
import { api, uid } from '../api.js';

function Slideshow({ photos, start, onClose }) {
  const [i, setI] = useState(start);
  const [play, setPlay] = useState(true);
  useEffect(() => {
    if (!play) return;
    const t = setInterval(() => setI((x) => (x + 1) % photos.length), 4500);
    return () => clearInterval(t);
  }, [play, photos.length]);
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const p = photos[i] || photos[0];
  if (!p) return null;
  const go = (d) => setI((x) => (x + d + photos.length) % photos.length);
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-40 blur-2xl scale-110" style={{ backgroundImage: `url(${p.url})` }} />
      <img key={p.id} src={p.url} alt="" className="kenburns relative max-h-[72vh] max-w-[92vw] object-contain shadow-2xl border-8 border-white" />
      <div key={p.id + 'c'} className="relative text-center text-white mt-5 px-4 rise">
        <p className="serif italic text-xl sm:text-2xl">{p.caption}</p>
        <p className="text-sm opacity-80">{p.date}</p>
      </div>
      <div className="relative flex gap-2 mt-5">
        <button className="btn2" onClick={() => go(-1)}>‹</button>
        <button className="btn2" onClick={() => setPlay(!play)}>{play ? '⏸' : '▶'}</button>
        <button className="btn2" onClick={() => go(1)}>›</button>
        <button className="btn2" onClick={onClose}>✕ Close</button>
      </div>
    </div>
  );
}

export default function Gallery({ data, update, edit }) {
  const [show, setShow] = useState(null);
  const [busy, setBusy] = useState(false);
  const photos = data.photos;
  const addPhotos = async (e) => {
    setBusy(true);
    try {
      const urls = await api.upload(e.target.files);
      const today = new Date().toISOString().slice(0, 10);
      update((d) => { d.photos.push(...urls.map((url) => ({ id: uid(), url, caption: '', date: today }))); });
    } catch (x) { alert(x.message); }
    setBusy(false); e.target.value = '';
  };
  const set = (id, k, v) => update((d) => { d.photos.find((p) => p.id === id)[k] = v; });
  const replace = async (id, e) => {
    try { const [u] = await api.upload(e.target.files); set(id, 'url', u); } catch (x) { alert(x.message); }
    e.target.value = '';
  };
  const del = (id) => { if (confirm('Delete this photo?')) update((d) => { d.photos = d.photos.filter((p) => p.id !== id); }); };
  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h2 className="script text-5xl sm:text-6xl text-center gold-text mb-6">Our Memory Gallery</h2>
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {photos.length > 0 && <button className="btn" onClick={() => setShow(0)}>▶ Play Slideshow</button>}
        {edit && <label className="btn cursor-pointer">{busy ? 'Uploading…' : '📷 Upload photos'}<input type="file" accept="image/*" multiple hidden onChange={addPhotos} /></label>}
      </div>
      {photos.length === 0 && <p className="text-center opacity-70">{edit ? 'Upload your first photos of us ❤️' : 'Photos coming soon…'}</p>}
      <div className="columns-2 md:columns-3 gap-4">
        {photos.map((p, i) => (
          <figure key={p.id} className="break-inside-avoid mb-4 glass rounded-2xl p-2 rise transition hover:-translate-y-1 hover:shadow-2xl" style={{ animationDelay: (i % 8) * 0.08 + 's' }}>
            <img src={p.url} alt={p.caption} className="w-full rounded-xl cursor-pointer" onClick={() => setShow(i)} />
            {edit ? (
              <div className="grid gap-1 mt-2">
                <input className="inp" placeholder="Caption" value={p.caption} onChange={(e) => set(p.id, 'caption', e.target.value)} />
                <input className="inp" type="date" value={p.date} onChange={(e) => set(p.id, 'date', e.target.value)} />
                <div className="flex gap-1">
                  <label className="btn2 cursor-pointer flex-1 text-center">Replace<input type="file" accept="image/*" hidden onChange={(e) => replace(p.id, e)} /></label>
                  <button className="btn2 !text-red-600" onClick={() => del(p.id)}>🗑</button>
                </div>
              </div>
            ) : (
              <figcaption className="px-2 py-2 text-center"><p className="serif italic">{p.caption}</p><p className="text-xs opacity-60">{p.date}</p></figcaption>
            )}
          </figure>
        ))}
      </div>
      {show !== null && <Slideshow photos={photos} start={show} onClose={() => setShow(null)} />}
    </section>
  );
}

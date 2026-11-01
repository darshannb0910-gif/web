import { useEffect, useState } from 'react';
import { api, uid } from '../api.js';

const THEMES = [
  { a: '#ffe4ec', b: '#fbcfe8', e: '💫', c: '#be185d' },
  { a: '#fae8ff', b: '#e9d5ff', e: '🌹', c: '#7e22ce' },
  { a: '#fff1f2', b: '#fecdd3', e: '💬', c: '#be123c' },
  { a: '#fdf2f8', b: '#f5d0fe', e: '✨', c: '#a21caf' },
  { a: '#ffedd5', b: '#fbcfe8', e: '🌅', c: '#c2410c' },
  { a: '#ede9fe', b: '#fecdd3', e: '💝', c: '#6d28d9' },
  { a: '#e0e7ff', b: '#fbcfe8', e: '🌙', c: '#4338ca' }
];

function Card({ s, i, last, edit, update, move, del }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (edit) setOpen(true); }, [edit]);
  const T = THEMES[s.theme % THEMES.length];
  const set = (k, v) => update((d) => { d.sections.find((x) => x.id === s.id)[k] = v; });
  const add = async (e) => {
    setBusy(true);
    try { const urls = await api.upload(e.target.files); update((d) => { d.sections.find((x) => x.id === s.id).photos.push(...urls); }); }
    catch (x) { alert(x.message); }
    setBusy(false); e.target.value = '';
  };
  const rmPhoto = (u) => update((d) => { const x = d.sections.find((q) => q.id === s.id); x.photos = x.photos.filter((p) => p !== u); });
  return (
    <div className={`relative md:w-[calc(50%-2rem)] ${i % 2 ? 'md:ml-auto' : ''} rise`} style={{ animationDelay: i * 0.08 + 's' }}>
      <div className="absolute -left-[2.35rem] md:left-auto md:-right-[3.1rem] top-6 text-2xl hidden md:block" style={i % 2 ? { left: '-3.1rem', right: 'auto' } : {}}>{T.e}</div>
      <div className="rounded-3xl overflow-hidden shadow-xl border border-white/80 transition hover:-translate-y-1" style={{ background: `linear-gradient(135deg,${T.a},${T.b})`, borderRadius: i % 2 ? '2rem 0.75rem 2rem 0.75rem' : '0.75rem 2rem 0.75rem 2rem' }}>
        <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => setOpen(!open)}>
          <span className="text-3xl">{T.e}</span>
          {edit ? (
            <input className="inp serif text-lg font-semibold" value={s.title} onClick={(e) => e.stopPropagation()} onChange={(e) => set('title', e.target.value)} />
          ) : <h3 className="serif text-xl sm:text-2xl flex-1" style={{ color: T.c }}>{s.title}</h3>}
          <span className="text-xl transition-transform" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>⌄</span>
        </div>
        {open && (
          <div className="px-5 pb-5 rise">
            {edit ? <textarea className="inp min-h-[140px]" value={s.text} onChange={(e) => set('text', e.target.value)} placeholder="Write your feelings and story here…" />
              : <p className="whitespace-pre-line leading-relaxed text-lg">{s.text || '…'}</p>}
            {s.photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {s.photos.map((u) => (
                  <div key={u} className="relative group rotate-1 even:-rotate-2 bg-white p-1.5 pb-5 shadow-md">
                    <img src={u} className="w-full h-32 object-cover" alt="" />
                    {edit && <button onClick={() => rmPhoto(u)} className="absolute top-1 right-1 bg-white/90 rounded-full w-7 h-7 text-sm">✕</button>}
                  </div>
                ))}
              </div>
            )}
            {edit && (
              <div className="flex flex-wrap gap-2 mt-4 items-center">
                <label className="btn2 cursor-pointer">{busy ? 'Uploading…' : '📷 Add photos'}<input type="file" accept="image/*" multiple hidden onChange={add} /></label>
                <button className="btn2" onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
                <button className="btn2" onClick={() => move(i, 1)} disabled={last}>↓</button>
                <button className="btn2 !text-red-600" onClick={() => del(s.id)}>🗑 Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Story({ data, update, edit }) {
  const add = () => update((d) => { d.sections.push({ id: uid(), title: 'A New Memory', theme: Math.floor(Math.random() * 7), text: '', photos: [] }); });
  const move = (i, dir) => update((d) => { const j = i + dir; if (j < 0 || j >= d.sections.length) return; [d.sections[i], d.sections[j]] = [d.sections[j], d.sections[i]]; });
  const del = (id) => { if (confirm('Delete this memory?')) update((d) => { d.sections = d.sections.filter((s) => s.id !== id); }); };
  return (
    <section className="max-w-5xl mx-auto px-4 py-12">
      <h2 className="script text-5xl sm:text-6xl text-center gold-text mb-10">Our Love Story</h2>
      <div className="relative pl-6 md:pl-0">
        <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-pink-300 via-purple-300 to-pink-300" />
        <div className="grid gap-6">
          {data.sections.map((s, i) => <Card key={s.id} {...{ s, i, edit, update, move, del }} last={i === data.sections.length - 1} />)}
        </div>
      </div>
      {edit && <div className="text-center mt-8"><button className="btn" onClick={add}>＋ Add a new memory</button></div>}
    </section>
  );
}

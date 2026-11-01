import { useEffect, useState } from 'react';
import { api } from '../api.js';

export function Special({ data, update, edit }) {
  const [msg, setMsg] = useState(null);
  const [burst, setBurst] = useState(0);
  const show = () => {
    const r = data.reasons.length ? data.reasons : ['Because you are you ❤️'];
    setMsg(r[Math.floor(Math.random() * r.length)]); setBurst((b) => b + 1);
  };
  return (
    <div className="glass rounded-3xl p-8 text-center relative overflow-hidden">
      <button className="btn text-lg" onClick={show}>Why You Are Special ❤️</button>
      {msg && <p key={burst} className="script text-4xl sm:text-5xl gold-text mt-6 rise">{msg}</p>}
      {burst > 0 && Array.from({ length: 14 }, (_, i) => (
        <span key={burst + '-' + i} className="absolute bottom-0 pointer-events-none" style={{ left: 5 + i * 6.5 + '%', fontSize: 20 + (i % 4) * 8, animation: `floatUp ${2 + (i % 5) * 0.4}s ease-out ${i * 0.05}s both` }}>{['❤️', '💖', '💕'][i % 3]}</span>
      ))}
      {edit && (
        <div className="text-left mt-6">
          <p className="text-sm font-semibold">Your reasons (one per line):</p>
          <textarea className="inp min-h-[110px]" value={data.reasons.join('\n')} onChange={(e) => update((d) => { d.reasons = e.target.value.split('\n').filter(Boolean); })} />
        </div>
      )}
    </div>
  );
}

export function Countdown({ data, update, edit }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const C = data.countdown, diff = new Date(C.date).getTime() - now;
  const set = (k, v) => update((d) => { d.countdown[k] = v; });
  const parts = [['Days', 864e5], ['Hours', 36e5], ['Minutes', 6e4], ['Seconds', 1e3]];
  return (
    <div className="glass rounded-3xl p-8 text-center">
      {edit ? <input className="inp serif text-center text-xl mb-3" value={C.title} onChange={(e) => set('title', e.target.value)} /> : <h3 className="serif text-2xl mb-4">{C.title}</h3>}
      {isNaN(diff) ? <p>Set a date ✨</p> : diff <= 0 ? <p className="script text-5xl gold-text">Today is our day! 🎉❤️</p> : (
        <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
          {parts.map(([l, ms]) => (
            <div key={l} className="rounded-2xl py-4 bg-gradient-to-br from-pink-200 to-purple-200 shadow-inner">
              <div className="text-3xl sm:text-5xl font-bold text-pink-700">{String(Math.floor(diff / ms) % (l === 'Days' ? 1e9 : l === 'Hours' ? 24 : 60)).padStart(2, '0')}</div>
              <div className="text-xs sm:text-sm">{l}</div>
            </div>
          ))}
        </div>
      )}
      {edit && <input type="datetime-local" className="inp mt-4 max-w-xs" value={C.date} onChange={(e) => set('date', e.target.value)} />}
    </div>
  );
}

export function MemoryBook({ data }) {
  const pages = data.sections.map((s) => ({ ...s, img: s.photos[0] }));
  const [i, setI] = useState(0);
  if (!pages.length) return null;
  const p = pages[Math.min(i, pages.length - 1)];
  return (
    <div className="glass rounded-3xl p-5 sm:p-8">
      <h3 className="script text-4xl text-center gold-text mb-4">Our Memory Book 📖</h3>
      <div key={i} className="flip grid md:grid-cols-2 rounded-2xl overflow-hidden shadow-xl min-h-[300px]" style={{ background: '#fffaf5' }}>
        <div className="grid place-items-center bg-pink-100 p-4 border-b md:border-b-0 md:border-r-4 border-pink-200">
          {p.img ? <img src={p.img} className="max-h-72 object-cover rounded shadow-md rotate-1 border-8 border-white" alt="" /> : <span className="text-8xl heart-beat">❤️</span>}
        </div>
        <div className="p-6 max-h-80 overflow-auto"><h4 className="serif text-2xl text-pink-700 mb-3">{p.title}</h4><p className="whitespace-pre-line leading-relaxed">{p.text}</p></div>
      </div>
      <div className="flex justify-center items-center gap-4 mt-4">
        <button className="btn2" disabled={i === 0} onClick={() => setI(i - 1)}>‹ Prev</button>
        <span className="text-sm">Page {i + 1} / {pages.length}</span>
        <button className="btn2" disabled={i >= pages.length - 1} onClick={() => setI(i + 1)}>Next ›</button>
      </div>
    </div>
  );
}

export function Secret({ data, update, edit }) {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  const [bad, setBad] = useState('');
  const [n, setN] = useState(0);
  const open = async () => {
    try { setMsg((await api.secret(pw)).message); setBad(''); } catch (e) { setBad(e.message); setN((x) => x + 1); }
  };
  const S = data.secret;
  return (
    <div className="glass rounded-3xl p-8 text-center">
      <h3 className="serif text-2xl mb-1">🔒 A Secret Message</h3>
      <p className="text-sm opacity-70 mb-4">{S.hint}</p>
      {!msg ? (
        <div key={n} className={`flex gap-2 max-w-sm mx-auto ${bad ? 'shake' : ''}`}>
          <input className="inp" type="password" placeholder="Secret word" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && open()} />
          <button className="btn !px-5" onClick={open}>Unlock</button>
        </div>
      ) : <p className="script text-4xl sm:text-5xl gold-text rise whitespace-pre-line">{msg}</p>}
      {bad && <p className="text-sm text-pink-700 mt-2">{bad}</p>}
      {edit && (
        <div className="grid gap-2 mt-6 text-left">
          <p className="text-sm font-semibold">Configure your secret:</p>
          <input className="inp" placeholder="Hint" value={S.hint || ''} onChange={(e) => update((d) => { d.secret.hint = e.target.value; })} />
          <input className="inp" placeholder="Password" value={S.password || ''} onChange={(e) => update((d) => { d.secret.password = e.target.value; })} />
          <textarea className="inp" placeholder="Secret message" value={S.message || ''} onChange={(e) => update((d) => { d.secret.message = e.target.value; })} />
        </div>
      )}
    </div>
  );
}

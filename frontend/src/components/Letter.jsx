import { useEffect, useRef, useState } from 'react';

export default function Letter({ data, update, edit }) {
  const [stage, setStage] = useState(0); // 0 closed, 1 opening, 2 reading
  const [shown, setShown] = useState('');
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach((t) => { clearTimeout(t); clearInterval(t); }), []);
  const L = data.letter;
  const set = (k, v) => update((d) => { d.letter[k] = v; });
  const read = () => {
    setStage(1); setShown('');
    timers.current.push(setTimeout(() => {
      setStage(2); let i = 0;
      const t = setInterval(() => { i += 2; setShown(L.text.slice(0, i)); if (i >= L.text.length) clearInterval(t); }, 40);
      timers.current.push(t);
    }, 1100));
  };
  const close = () => { timers.current.forEach((t) => { clearTimeout(t); clearInterval(t); }); setStage(0); setShown(''); };
  return (
    <section className="max-w-3xl mx-auto px-4 py-12 text-center">
      {edit ? <input className="inp script !text-4xl text-center mb-4" value={L.title} onChange={(e) => set('title', e.target.value)} />
        : <h2 className="script text-5xl sm:text-6xl gold-text mb-8">{L.title}</h2>}
      <div className="relative mx-auto w-72 h-48 cursor-pointer" style={{ perspective: 800 }} onClick={stage === 0 ? read : undefined}>
        <div className="absolute inset-0 rounded-lg shadow-xl" style={{ background: 'linear-gradient(135deg,#f4c2c2,#b76e79)' }} />
        <div className="absolute left-0 right-0 top-0 h-28 transition-transform duration-1000" style={{ transformOrigin: 'top', background: '#c98a93', clipPath: 'polygon(0 0,100% 0,50% 100%)', transform: stage ? 'rotateX(180deg)' : 'none', zIndex: stage ? 0 : 3 }} />
        {stage === 0 && <div className="absolute inset-0 grid place-items-center text-5xl heart-beat" style={{ zIndex: 4, top: '-10px' }}>❤️</div>}
      </div>
      {stage === 0 && <button className="btn mt-8" onClick={read}>Read My Heart 💌</button>}
      {stage === 2 && (
        <div className="glass rounded-3xl p-6 sm:p-10 mt-8 text-left rise">
          <p className={`serif text-lg sm:text-xl leading-loose whitespace-pre-line ${shown.length < L.text.length ? 'caret' : ''}`}>{shown}</p>
          <div className="text-center mt-6"><button className="btn2" onClick={close}>Close the letter ✉️</button></div>
        </div>
      )}
      {edit && (
        <div className="mt-10 text-left">
          <p className="font-semibold mb-1">✍️ Write everything you feel:</p>
          <textarea className="inp min-h-[260px] serif text-lg" value={L.text} onChange={(e) => set('text', e.target.value)} />
        </div>
      )}
    </section>
  );
}

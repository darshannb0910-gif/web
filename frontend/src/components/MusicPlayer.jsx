import { useEffect, useRef, useState } from 'react';
export default function MusicPlayer({ src }) {
  const a = useRef(null);
  const [on, setOn] = useState(false);
  const [vol, setVol] = useState(0.5);
  useEffect(() => { if (a.current) a.current.volume = vol; }, [vol]);
  useEffect(() => { setOn(false); }, [src]);
  const toggle = () => {
    if (!src) return alert('No music yet. Open the dashboard (🔐) to choose a song.');
    if (on) a.current.pause(); else a.current.play().catch(() => {});
    setOn(!on);
  };
  return (
    <div className="flex items-center gap-2">
      {src && <audio ref={a} src={src} loop />}
      <button onClick={toggle} className="btn2" title="Play / pause music">{on ? '⏸ Music' : '🎵 Music'}</button>
      <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-16 sm:w-24 accent-pink-500" title="Volume" />
    </div>
  );
}

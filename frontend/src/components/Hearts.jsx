import { useMemo } from 'react';
const E = ['❤️', '💖', '💗', '💕', '🌸', '✨'];
export default function Hearts() {
  const items = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    e: E[i % E.length], left: Math.random() * 100, size: 14 + Math.random() * 26,
    dur: 10 + Math.random() * 14, delay: -Math.random() * 20
  })), []);
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
      {items.map((h, i) => (
        <span key={i} className="absolute bottom-[-60px]" style={{ left: h.left + '%', fontSize: h.size, opacity: 0, animation: `floatUp ${h.dur}s linear ${h.delay}s infinite` }}>{h.e}</span>
      ))}
    </div>
  );
}

import { useState } from 'react';
export default function Welcome({ data, onOpen }) {
  const [leaving, setLeaving] = useState(false);
  const go = () => { setLeaving(true); setTimeout(onOpen, 800); };
  return (
    <section className={`relative z-10 min-h-screen grid place-items-center text-center px-6 transition-all duration-700 ${leaving ? 'opacity-0 scale-110 blur-sm' : ''}`}>
      <div className="rise max-w-2xl">
        <div className="text-8xl sm:text-9xl heart-beat inline-block">❤️</div>
        <h1 className="script text-5xl sm:text-7xl gold-text mt-6 leading-tight">{data.site.welcomeTitle}</h1>
        <p className="serif italic text-lg sm:text-2xl mt-5">{data.site.welcomeSubtitle}</p>
        <button className="btn mt-10 text-lg" onClick={go}>Open Your Surprise 💌</button>
      </div>
    </section>
  );
}

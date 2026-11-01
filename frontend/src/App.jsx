import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import Hearts from './components/Hearts.jsx';
import Welcome from './components/Welcome.jsx';
import MusicPlayer from './components/MusicPlayer.jsx';
import Story from './components/Story.jsx';
import Gallery from './components/Gallery.jsx';
import VideoMaker from './components/VideoMaker.jsx';
import Letter from './components/Letter.jsx';
import { Special, Countdown, MemoryBook, Secret } from './components/Extras.jsx';
import Admin from './components/Admin.jsx';

export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [opened, setOpened] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [editing, setEditing] = useState(true);
  const [saved, setSaved] = useState('');
  const [shareStatus, setShareStatus] = useState('');
  const dirty = useRef(false);
  const shareTimer = useRef();

  useEffect(() => {
    const savedPassword = sessionStorage.getItem('adminpw');
    if (!savedPassword) return;
    api.login(savedPassword).then(() => setAdmin(true)).catch(() => {
      sessionStorage.removeItem('adminpw');
    });
  }, []);

  useEffect(() => () => clearTimeout(shareTimer.current), []);

  const shareStory = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, text: 'Take a look at our love story ❤️', url });
        setShareStatus('Thanks for sharing!');
      } else {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          const field = document.createElement('textarea');
          field.value = url;
          field.style.position = 'fixed';
          field.style.opacity = '0';
          document.body.appendChild(field);
          field.select();
          const copied = document.execCommand('copy');
          field.remove();
          if (!copied) throw new Error('Clipboard access is unavailable.');
        }
        setShareStatus('Story link copied. Send it to someone you love!');
      }
      clearTimeout(shareTimer.current);
      shareTimer.current = setTimeout(() => setShareStatus(''), 3500);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setShareStatus(`Could not share the link: ${e.message}`);
    }
  };

  useEffect(() => { api.data().then(setData).catch((e) => setErr(e.message)); }, [admin]);

  const update = useCallback((fn) => {
    dirty.current = true;
    setData((d) => { const c = structuredClone(d); fn(c); return c; });
  }, []);

  useEffect(() => {
    if (!dirty.current || !admin || !data) return;
    setSaved('saving');
    const t = setTimeout(() => {
      api.save(data).then(() => { dirty.current = false; setSaved('saved'); }).catch((e) => setSaved('error: ' + e.message));
    }, 700);
    return () => clearTimeout(t);
  }, [data, admin]);

  if (err) return <div className="min-h-screen grid place-items-center p-6 text-center"><div className="glass rounded-3xl p-8 max-w-md"><div className="text-5xl mb-3">💔</div><p className="font-semibold">Can't reach the backend.</p><p className="text-sm mt-2">Make sure the server is running (<code>npm start</code> in the backend folder).</p><p className="text-xs mt-2 opacity-70">{err}</p></div></div>;
  if (!data) return <div className="min-h-screen grid place-items-center"><div className="text-7xl heart-beat">❤️</div></div>;

  const edit = admin && editing;
  const p = { data, update, edit };
  const nav = [['story', 'Our Story'], ['gallery', 'Gallery'], ...(edit ? [['movie', '🎬 Movie']] : []), ['letter', 'Letter'], ['surprises', 'Surprises']];

  return (
    <>
      <Hearts />
      {!opened ? (
        <Welcome {...p} onOpen={() => setOpened(true)} />
      ) : (
        <main className="relative z-10 rise">
          <nav className="sticky top-0 z-30 glass px-3 py-2 flex items-center gap-2 justify-between">
            <span className="script text-2xl sm:text-3xl gold-text whitespace-nowrap">Our Love Story ❤️</span>
            <div className="hidden md:flex gap-4 text-sm font-semibold">
              {nav.map(([id, l]) => <a key={id} href={'#' + id} className="hover:text-pink-600">{l}</a>)}
            </div>
            <MusicPlayer src={data.site.bgMusic} />
          </nav>
          <header className="text-center py-16 px-4">
            <h1 className="script text-6xl sm:text-8xl gold-text">Our Love Story</h1>
            <p className="serif italic mt-4 text-lg sm:text-xl">{data.site.welcomeSubtitle}</p>
            <div className="text-5xl mt-6 heart-beat inline-block">💞</div>
          </header>
          <div id="story"><Story {...p} /></div>
          <div id="gallery"><Gallery {...p} /></div>
          {edit && <div id="movie"><VideoMaker {...p} /></div>}
          <div id="letter"><Letter {...p} /></div>
          <div id="surprises" className="max-w-5xl mx-auto px-4 pb-24 grid gap-8">
            <Special {...p} />
            <Countdown {...p} />
            <MemoryBook {...p} />
            <Secret {...p} />
          </div>
          <footer className="text-center pb-24 script text-3xl gold-text">Made with all my love ❤️</footer>
        </main>
      )}
      <Admin {...p} admin={admin} setAdmin={setAdmin} editing={editing} setEditing={setEditing} saved={saved} />
      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
        {shareStatus && <p role="status" aria-live="polite" className="glass rounded-xl px-4 py-2 text-sm shadow-lg">{shareStatus}</p>}
        <button type="button" className="btn2 shadow-lg" onClick={shareStory} aria-label="Share this story">🔗 Share</button>
      </div>
    </>
  );
}

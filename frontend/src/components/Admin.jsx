import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Admin({ admin, setAdmin, editing, setEditing, saved, data, update }) {
  const [open, setOpen] = useState(false);
  const [login, setLogin] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [tracks, setTracks] = useState([]);
  useEffect(() => { if (open) api.music().then(setTracks).catch(() => {}); }, [open]);

  const doLogin = async () => {
    try { sessionStorage.setItem('adminpw', pw); await api.login(pw); setAdmin(true); setLogin(false); setOpen(true); setErr(''); setPw(''); }
    catch (e) { sessionStorage.removeItem('adminpw'); setErr(e.message); }
  };
  const logout = () => { sessionStorage.removeItem('adminpw'); setAdmin(false); setOpen(false); };
  const upMusic = async (e) => { try { const [u] = await api.upload(e.target.files); update((d) => { d.site.bgMusic = u; }); } catch (x) { alert(x.message); } };
  const backup = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = 'love-story-backup.json'; a.click();
  };
  const site = (k, v) => update((d) => { d.site[k] = v; });
  const status = saved === 'saving' ? '💾 Saving…' : saved === 'saved' ? '✅ All changes saved' : saved;

  return (
    <>
      <button className="fixed bottom-4 left-4 z-40 btn2 shadow-lg" onClick={() => (admin ? setOpen(!open) : setLogin(true))}>🔐 {admin ? 'Dashboard' : 'Edit'}</button>
      {login && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-4" onClick={() => setLogin(false)}>
          <div className="glass rounded-3xl p-6 w-full max-w-sm rise" onClick={(e) => e.stopPropagation()}>
            <h3 className="serif text-xl mb-3">Private Dashboard</h3>
            <input className="inp" type="password" autoFocus placeholder="Admin password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && doLogin()} />
            {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
            <button className="btn w-full mt-4" onClick={doLogin}>Unlock</button>
          </div>
        </div>
      )}
      {admin && open && (
        <aside className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-96 glass p-5 overflow-auto rise">
          <div className="flex justify-between items-center mb-4"><h3 className="serif text-xl">💖 Dashboard</h3><button className="btn2" onClick={() => setOpen(false)}>✕</button></div>
          <p className="text-sm mb-4">{status || 'Edits save automatically.'}</p>
          <label className="flex items-center gap-2 mb-4 font-semibold"><input type="checkbox" checked={editing} onChange={(e) => setEditing(e.target.checked)} className="accent-pink-500" /> Edit mode (uncheck to preview as visitor)</label>
          <div className="grid gap-3 text-sm font-semibold">
            <label>Welcome title<input className="inp" value={data.site.welcomeTitle} onChange={(e) => site('welcomeTitle', e.target.value)} /></label>
            <label>Welcome subtitle<textarea className="inp" value={data.site.welcomeSubtitle} onChange={(e) => site('welcomeSubtitle', e.target.value)} /></label>
            <label>Background music
              <select className="inp" value={data.site.bgMusic} onChange={(e) => site('bgMusic', e.target.value)}>
                <option value="">None</option>
                {tracks.map((t) => <option key={t.url} value={t.url}>{t.name}</option>)}
                {data.site.bgMusic.startsWith('/uploads/') && <option value={data.site.bgMusic}>My uploaded song</option>}
              </select>
            </label>
            <label className="btn2 cursor-pointer text-center">🎵 Upload my own song<input type="file" accept="audio/*" hidden onChange={upMusic} /></label>
          </div>
          <p className="text-xs opacity-70 mt-5">Add, edit and delete memories, photos, captions, the letter, countdown and secret directly on the page — the 🎬 Movie section appears in edit mode.</p>
          <div className="flex gap-2 mt-5"><button className="btn2" onClick={backup}>⬇ Backup data</button><button className="btn2" onClick={logout}>Log out</button></div>
        </aside>
      )}
    </>
  );
}

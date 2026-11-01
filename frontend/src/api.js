const pw = () => sessionStorage.getItem('adminpw') || '';
const h = (json) => ({ 'x-admin': pw(), ...(json ? { 'Content-Type': 'application/json' } : {}) });
async function j(r) {
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong');
  return d;
}
export const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
export const api = {
  data: () => fetch('/api/data', { headers: h() }).then(j),
  save: (d) => fetch('/api/data', { method: 'PUT', headers: h(true), body: JSON.stringify(d) }).then(j),
  login: (password) => fetch('/api/login', { method: 'POST', headers: h(true), body: JSON.stringify({ password }) }).then(j),
  secret: (password) => fetch('/api/secret', { method: 'POST', headers: h(true), body: JSON.stringify({ password }) }).then(j),
  music: () => fetch('/api/music').then(j),
  upload: async (files) => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('files', f));
    return (await fetch('/api/upload', { method: 'POST', headers: h(), body: fd }).then(j)).urls;
  },
  video: (fd) => fetch('/api/video', { method: 'POST', headers: h(), body: fd }).then(j)
};

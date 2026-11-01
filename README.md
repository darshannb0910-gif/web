# Our Love Story ❤️

A personal, fully editable romantic scrapbook. React + Vite + Tailwind (frontend) and Node + Express (backend).
Data is saved in `backend/data/db.json`, photos in `backend/uploads`, videos in `backend/videos`.
Video export uses FFmpeg (installed automatically through the `ffmpeg-static` npm package — nothing else to install).

## Run on Windows
1. Install Node.js LTS (v18+) from https://nodejs.org (restart your terminal afterwards).
2. **Backend** — open PowerShell in the `backend` folder:
   ```
   copy .env.example .env
   npm install
   npm start
   ```
   Edit `.env` first and set `ADMIN_PASSWORD` to your private editing password.
3. **Frontend** — open a *second* PowerShell in the `frontend` folder:
   ```
   npm install
   npm run dev
   ```
4. Open http://localhost:5173

The backend status is available at http://localhost:5000/api/health. The backend root
at http://localhost:5000 also returns a small JSON status response; the app itself
is served by the frontend on port 5173.

## Editing
Click **🔐 Edit** (bottom-left), enter your admin password. Story cards open automatically
in edit mode so their messages can be changed directly. Other edits autosave as well.
Visitors who open the site see it read-only.
Use **🔗 Share** to share the site with your device's share sheet or copy its link.
Recipients need a publicly deployed URL to open the story; a localhost link only works
on your own computer.

## Music
Drop royalty-free `.mp3/.wav/.m4a/.ogg` files into `backend/music` (e.g. from pixabay.com/music or freemusicarchive.org).
They then appear in the music dropdowns. You can also upload your own song in the dashboard / movie maker.
Music never autoplays.

## Deploy publicly on Render
1. Push this project folder to a GitHub repository and connect that repository to Render.
2. In Render, choose **New → Blueprint** and select the repository containing `render.yaml`.
3. Enter your editing password in the prompted `ADMIN_PASSWORD` field, then create the service. Keep it private and do not add it to the repository.
4. Open the public `onrender.com` URL shown for the service after its health check passes.

The Blueprint builds the frontend and serves it from the backend on one public URL using
Render's free web service. Free services do not include a persistent disk: story edits,
uploaded photos, music and exported videos are stored on temporary instance storage and
may be lost when the service restarts or redeploys. Keep local backups of anything you
want to preserve. Free instances may also take longer to respond after periods without
traffic.

For local use, the backend requires `ADMIN_PASSWORD` in `backend/.env`. Never commit
that file or uploaded personal photos to a public repository.

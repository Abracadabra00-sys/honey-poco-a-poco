# Honey Poco a Poco

Your content operating system, connected to a real Supabase database — data persists across devices and sessions.

## Deploy to Netlify

**Option A — drag and drop (simplest, but Netlify needs to build it first):**
Netlify's drag-and-drop only works with already-built static files. Since this is a source project, use Option B instead.

**Option B — connect via GitHub (recommended):**
1. Create a free GitHub account if you don't have one.
2. Create a new repository and upload all these files to it (GitHub's website lets you drag files in directly — no command line needed).
3. Go to netlify.com → "Add new site" → "Import an existing project" → connect GitHub → pick this repo.
4. Netlify will detect it's a Vite project. Build settings should auto-fill:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click Deploy. Netlify installs everything and builds it for you.
6. You'll get a live URL like `your-site-name.netlify.app`.

## Your Supabase project

- Project URL and key are already wired into `src/supabaseClient.js`.
- Data lives in the `hpp_data` table in your Supabase project.

## Local development (optional, only if you want to preview on a computer)

```
npm install
npm run dev
```

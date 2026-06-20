# GrillRechner

Vue/Vite frontend for planning grill shopping from product CSVs and survey CSVs.

## Local development

```bash
npm install
npm run dev
```

## Optional Supabase backend

The app still works with local browser storage if Supabase is not configured.

To enable shared online events:

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run the contents of `supabase-schema.sql`.
4. Copy `.env.example` to `.env.local`.
5. Fill in:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

Only use the public anon key in the frontend. Never use the service role key in GitHub Pages.

## GitHub Pages environment variables

If the site is built by GitHub Actions, add these as repository variables or secrets and expose them during the Vite build:

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

With Supabase configured, the app can:

- create an online event;
- save products, global grams, and ratings;
- load an event from `?event=<uuid>`;
- copy a shareable event link.

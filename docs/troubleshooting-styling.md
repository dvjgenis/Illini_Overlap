# Troubleshooting: UI looks unstyled (default fonts, purple links, vertical layout)

If IlliniOverlap looks like a plain HTML page (serif fonts, blue/purple underlined titles, broken stepper), **Tailwind / `globals.css` is probably not loading**.

## Quick checks

1. **Run the app from the repo root** with the Makefile (not ad-hoc `next` flags):

   ```bash
   make dev
   ```

   Open **http://localhost:3000** (not a `file://` URL and not a different port unless you changed it).

2. **Hard refresh** the tab (clear cache for the site) or try an incognito window.

3. **DevTools → Network**: reload and confirm the main **CSS** request (under `_next/static/css/`) returns **200**, not **404**. If it 404s, you often have a stale build, wrong base path, or multiple `next dev` instances fighting for the same port.

4. **One dev server**: stop other Next processes, then:

   ```bash
   make clean
   make install
   make dev
   ```

5. **Ad / privacy extensions**: some block `_next/static` or inline scripts; try disabling for localhost.

6. **Verify the CSS entry**: [`app/layout.tsx`](../app/layout.tsx) must import `./globals.css` (it does in this repo). [`app/globals.css`](../app/globals.css) must include `@tailwind` directives.

## Production

After `make build` + `make start`, assets are served from `.next/static`. If you deploy behind a reverse proxy, ensure `/_next/static/*` is forwarded and not cached incorrectly.

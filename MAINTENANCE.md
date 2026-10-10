# Maintaining the KIDEX website

This is a static website: HTML, one shared CSS file, one shared JavaScript file, and local images. It needs no application server, database, framework, or bundler. The current layout and copy are intentional; maintenance should preserve them unless a design change is requested.

## Where to make changes

| File or folder | Responsibility |
| --- | --- |
| `index.html`, `about.html`, `services.html`, `contact.html` | English source pages. Comments mark sections and shared components. |
| `translations/mk.json` | Exact English text mapped to Macedonian, including accessibility labels and metadata. |
| `mk/*.html` | Generated Macedonian pages, committed so hosting requires no build. |
| `css/style.css` | Design tokens, shared components, responsive layouts, and accessibility states. |
| `js/script.js` | Header shadow, mobile menu, language dropdown, showcase, copyright year, email-draft form. |
| `images/`, `favicon/` | Local assets. Photo sources are documented in `images/photo-sources.md`. |
| `tools/build.py` | Regenerates MK pages, refreshes SEO/sitemap, validates local links, creates the upload archive. |
| `data/projects.json`, `documents/projects/` | Bilingual project details and public PDF/PowerPoint files. See [PROJECTS.md](PROJECTS.md). |
| `tools/build-projects.cjs`, `js/projects.js` | Generates both Projects pages; progressively enhances PDF previews. |
| `tools/*.cjs`, `tools/check_site.py` | Local browser checks; never deployed as website code. |
| `.htaccess`, `_redirects`, `robots.txt`, `sitemap.xml` | Hosting redirects and search-engine discovery. |
| `.audit/`, `dist/` | Ignored local reports/screenshots and generated upload packages. |

## Editing pages and translations

1. Edit the English source page. Shared headers and footers appear in all four source pages, so update all four when changing either component. The two Projects pages inherit them from Contact when regenerated; edit project records in `data/projects.json` instead of their generated HTML.
2. When text changes, add the exact new English key and its Macedonian value to `translations/mk.json`. This includes `alt`, `aria-label`, and social/search descriptions. JSON does not support comments; keep explanations in this guide.
3. Rebuild and inspect both languages. A manual edit to `mk/` alone will be overwritten by the next build.
4. Check desktop and mobile, then run the relevant browser checks below.

Keep service IDs (`optimization`, `development`, `laboratory-equipment`, `it-solutions`) stable: menus, homepage links, and language switching all use them. Preserve text whitespace around inline links and emphasis. Empty `alt=""` identifies decorative photos; descriptive photos need translated alt text.

SVG symbols near the top of each page are reused with `<use href="#symbol-id">`. Decorative icons have `aria-hidden="true"`; the link or heading supplies their meaning. Reuse the same service icon in navigation and its detail section. The header uses the real KIDEX logo; the footer intentionally has no logo. Use real photography, not AI-generated photos.

## CSS and responsive behavior

Start with the `:root` tokens for colors, text sizes, spacing, and container width. Component comments identify the relevant rules. Later responsive/refinement rules intentionally override earlier declarations: moving them can change the design even when every declaration is retained. Do not reorder or bulk-merge them without comparing the rendered pages.

- **620px and below:** compact spacing and stacked layouts.
- **860px and below:** mobile navigation, language dropdown, and major column changes. JavaScript uses the same boundary.
- **1080/1100px:** intermediate content layouts and header action visibility.
- **Container queries:** reflow cards based on their available space, including enlarged text.

Classes such as `nav-ready`, `is-enhanced`, `is-open`, `is-active`, `is-scrolled`, `has-entered`, `is-error`, and `menu-open` are controlled by JavaScript. Do not remove their styles merely because they are absent from the initial HTML. `hidden`, `inert`, ARIA attributes, focus outlines, and reduced-motion rules are functional accessibility features.

The CSS cleanup removed selectors for retired designs but retained active cascade order. Avoid automatic CSS purging without checking interaction states and the no-JavaScript fallback.

## JavaScript behavior

`js/script.js` is loaded after the page markup and is wrapped in a function to avoid global variables. Optional components check whether their markup exists. English/Macedonian messages generated at runtime are at the top of this file, separate from the build-time translation catalog.

- The mobile menu keeps focus within visible navigation while making the page behind it inert. Escape, resizing, and browser history restore sensible focus.
- Language links retain the current section hash. JavaScript enhances the same links into a compact mobile dropdown; ordinary links remain usable without JavaScript.
- The homepage showcase uses accessible tabs, arrow keys, manual controls, and touch swipes. There is no automatic slide rotation. Arrival motion respects the visitor's reduced-motion preference.
- The contact form validates fields and opens a draft in the visitor's email app. It does **not** send, store, or confirm delivery. Clipboard copying has a manual fallback when permission is denied.

After changing CSS or JS, update the `?v=` number on the matching asset URL in the four English source pages and regenerate MK. These query strings refresh browser caches; they do not rename the files.

## Local build and preview

Run from the repository root with Python and Node.js installed. Node generates the Projects pages; neither runtime is needed on the hosting server:

```powershell
python -m pip install -r tools/requirements.txt
python tools/build.py
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. The build writes `dist/kidex-hosting.zip`; it never uploads or publishes anything. See [HOSTING.md](HOSTING.md) for deployment instructions.

## Browser verification

The Node checks need Playwright. If it is not installed locally:

```powershell
npm install --no-save --package-lock=false playwright
npx playwright install chromium
```

The scripts can instead use an existing installation by taking its module directory as the first argument. `.audit/axe.min.js` is the optional axe-core 4.10.3 bundle used by the general suite; the showcase accessibility checks require it. Keep it local and obtain it from the official axe-core distribution when setting up a fresh checkout.

```powershell
node tools/inspect-layout.cjs
node tools/qa-site.cjs playwright maintenance-check chromium
node tools/check-showcase.cjs
node tools/check-projects.cjs
```

`inspect-layout.cjs` and `qa-site.cjs` start their own loopback servers. The showcase check uses local files. Reports and screenshots go to `.audit/`. The general suite reports skipped accessibility checks as limitations if axe-core is absent; do not treat a skipped scan as a pass.

The optional Python checker requires a running preview on port 4173 plus the Python Playwright package and browser. The Node suite is broader and is the preferred regression check.

For a purely structural cleanup, capture before/after screenshots at mobile, tablet, and desktop widths in both languages. Check hover, keyboard focus, open menus, hash links, enlarged text, reduced motion, and no-JavaScript behavior as well as the initial view. Never use the real contact actions to send test messages.

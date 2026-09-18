# KIDEX website

The website is ready for static hosting. There are four English pages at the root and four Macedonian pages in `mk/`. No Node.js, PHP, database, CSS framework or build service is required on the host.

## Upload

1. Back up the current WordPress files, database and hosting configuration.
2. Extract `dist/kidex-hosting.zip` into a staging directory first. The archive contains only public website files, not development tools or audit data.
3. For the live site, upload the archive contents into the domain's document root (often `public_html`). `index.html` should be directly in that directory.
4. On Apache hosting, include the supplied `.htaccess` and replace the old WordPress rewrite block. It selects `index.html` and redirects `/about-us/`, `/what-we-do/` and `/contact/` to the new pages. Keep any hosting-specific HTTPS or security configuration supplied by your host. Other server types need equivalent redirects; `_redirects` is included for Netlify-style hosting.
5. Check HTTPS, English/Macedonian navigation, images, email and phone links, and all three old URLs after upload. No live deployment has been performed.

Canonical URLs and `sitemap.xml` use `https://kidex.mk/`. If the permanent domain changes, update `BASE` in `tools/build.py` and the URL in `robots.txt`, then rebuild. Preview subdirectories work because internal links and assets are relative.

## Contact behavior

The form validates input and opens a prefilled email draft addressed to `info@kidex.mk`. The visitor must send it from their email application. It does not claim delivery or store submissions. Copy-message and direct email/phone links are provided as alternatives. Clipboard support depends on the browser and normally requires HTTPS; there is a manual-copy fallback.

For automatic server-side delivery later, connect a hosting-supported mail endpoint or form service and update the explanatory copy in both languages. SMTP credentials must never be put into browser JavaScript.

## Edit and rebuild

Edit the root HTML files, `css/style.css`, and `js/script.js`. Macedonian copy is in `translations/mk.json`, keyed by the English source text. Preserve whitespace around inline text. When changing English copy, update the matching translation key. The generator fails when a translation is missing.

```powershell
python -m pip install -r tools/requirements.txt
python tools/build.py
```

This regenerates `mk/`, language metadata, `sitemap.xml`, validates internal links and anchor targets, and creates `dist/kidex-hosting.zip`. Generated Macedonian pages are included alongside the English pages, so normal hosting needs no build.

Local preview:

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`. To run browser checks, in a separate terminal:

```powershell
python -m pip install playwright
python -m playwright install chromium
python tools/check_site.py
```

English pages use Google Fonts with local fallback fonts. Macedonian uses Cyrillic-capable system fonts. Photography is served locally as optimized WebP; original JPEGs remain available as source assets.

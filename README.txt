KIDEX — STATIC WEBSITE
=======================

This is a plain HTML / CSS / JavaScript website. There is no build step,
no framework, and no server-side code. To preview it locally, just open
index.html in a browser. To publish it, upload every file in this folder
to your hosting (e.g. cPanel → public_html) keeping the same folder
structure.


FOLDER STRUCTURE
----------------
KIDEX/
├── index.html          Homepage
├── about.html           About page
├── services.html        Services page
├── contact.html          Contact page
├── css/
│   └── style.css        All styling
├── js/
│   └── script.js         Navigation, mobile menu, scroll animations, contact form
├── images/
│   ├── kidex-logo-full.png        Full logo lockup (symbol + wordmark + tagline)
│   ├── kidex-logo-horizontal.png  Same lockup, wide crop
│   └── kidex-logo-nav.png         Symbol + wordmark only (used in the nav bar)
├── favicon/
│   └── favicon-*.png / favicon.ico   Generated from the K + wheat symbol only
└── README.txt            This file


BEFORE YOU PUBLISH — PLEASE UPDATE
-----------------------------------
A few details weren't available from the source material used to build
this site, so they're left as clearly marked placeholders rather than
invented. Search the files for these and replace them:

1. Contact details (contact.html)
   - Email address
   - Phone number
   - Office address
   These currently show as italic placeholder text such as
   "[Add KIDEX contact email address]".

2. Contact form email (js/script.js)
   Near the top of the "Contact form" section there's a line:
       var CONTACT_EMAIL = ""; /* TODO: add the KIDEX contact email address */
   Add a real email address between the quotes so the "Send message"
   button on contact.html can open a pre-filled email to the right inbox.
   (This is a static site with no backend, so the form works by opening
   the visitor's own email client via a mailto: link — it does not send
   email from the server.)

3. Case studies / project examples (index.html, "Our focus" section)
   No specific past projects were available to reference, so this
   section currently points people to get in touch directly instead of
   listing invented case studies. Replace the note once real project
   examples are ready to publish.

Everything else — company name, tagline, the two core services (bread &
flour product optimization and new product development), and the
Instagram/website links — was taken directly from what's publicly known
about KIDEX and does not need to be changed.


LOGO
----
The logo files in /images and /favicon are cropped directly from the
two source logo images you supplied, with no recoloring, redrawing, or
distortion. The favicon uses only the K + wheat symbol, not the full
wordmark, per your instructions.


EDITING THE SITE
-----------------
- Colors, fonts, spacing and all component styling live in css/style.css,
  using CSS custom properties at the top of the file (--charcoal, --gold,
  etc.) so the palette can be adjusted in one place.
- Navigation, the mobile menu, scroll-reveal animations and the contact
  form are handled in js/script.js — plain JavaScript, no libraries.
- Each page repeats its own header/nav/footer markup (since this is a
  static site with no templating). If you add or rename a page, update
  the nav links near the top of every HTML file to match.
- Fonts (Fraunces for headings, Work Sans for body text) are loaded from
  Google Fonts via a <link> tag in each page's <head>. An internet
  connection is required for them to load; remove that link and add
  local font files if you need the site to work fully offline.


ACCESSIBILITY & PERFORMANCE NOTES
----------------------------------
- Animations respect prefers-reduced-motion.
- All interactive elements are keyboard-reachable with visible focus
  states.
- Images use descriptive alt text; decorative SVGs are marked
  aria-hidden.
- No JavaScript frameworks or animation libraries are used — everything
  is vanilla CSS/JS, so the page stays light and fast.

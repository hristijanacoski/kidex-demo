# Design and content review — 18 September 2026

## Previous website

Reviewed the publicly accessible pages at https://kidex.mk/, https://kidex.mk/about-us/, https://kidex.mk/what-we-do/ and https://kidex.mk/contact/ through their published WordPress page content. Confirmed:

- 25 years of practical experience and consulting across milling, bakery, confectionery and pasta technology.
- Product optimization, new product development, training, product specifications and laboratory equipment expertise.
- Contact email `info@kidex.mk`, telephone `+389 70 431 203`, and Boris Kidrich 6, Tetovo.

The supplied redesign already retained these core details. Existing IT service content was preserved. No client names, project metrics, testimonials or certifications were invented.

## Changes

- Kept the charcoal, warm neutral and gold palette, editorial typography and existing imagery.
- Introduced a bakery-photo hero with a consistent wheat motif; fixed SVG stroke inheritance, redundant wheat backgrounds and decorative layering.
- Added service links, service-section navigation, an IT-services entry on the homepage, and consistent laboratory-service links in the footer.
- Added complete English/Macedonian pages, matching-page language links, translated metadata and accessible labels, canonical URLs, language alternates and a sitemap.
- Fixed mobile menu focus handling, Escape-to-close, resize behavior, background interaction and scrolling while the menu is open.
- Added a skip link, visible keyboard focus, correct heading levels and readable navigation contrast.
- Removed the dependency on reveal JavaScript for content visibility; provided working navigation and direct contact options without JavaScript.
- Corrected contact validation, added callable telephone and email links, and made the email-draft behavior explicit with copy-message and manual-copy fallbacks.
- Added intrinsic image dimensions and optimized local WebP photography.
- Packaged a static hosting ZIP and redirects for old WordPress URLs. Preserved pre-existing local modifications and README deletions.

## Verification

Browser regression checks cover eight pages at 360, 390, 768, 1024 and 1440 pixels, image loading, horizontal overflow, language/section switching, mobile menu focus/Escape/resize, form validation, clipboard success/failure, and no-JavaScript navigation. Screenshots and machine-readable results are in the ignored `.audit/` directory.

The build validates every local resource and anchor destination. The site has not been deployed and actual email delivery is intentionally outside this static site's behavior.

Final axe-core 4.10.3 checks found no automated WCAG A/AA or best-practice violations on all eight pages at desktop and mobile widths. Automated checks do not replace human accessibility testing. Optimized photography reduces combined image transfer by about 641 KB compared with the original JPEGs.

## Spacing revision

Removed the decorative wheat overlay from the hero and the large wheat background from the focus section, as requested. Reduced desktop section padding from 128px to a maximum of 80px, removed stacked CTA spacing, tightened text spacing and mobile hero typography, and changed the focus content to a balanced two-column layout that stacks on mobile. Removed the redundant scroll cue to prevent crowding the hero metadata. Visually inspected the running local site and reran all 40 responsive combinations and desktop/mobile accessibility scans successfully.

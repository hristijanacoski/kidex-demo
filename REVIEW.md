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

## Alignment and usability review — 25 September 2026

Preserved the existing palette, typography, content and photography. Aligned shared two-column sections, standardized column gaps and card padding, centered desktop navigation, and unified fixed-header clearance. Corrected heading spacing, the homepage services' missing bottom divider, desktop CTA wrapping, mobile button widths, and the orphaned third photograph at tablet widths. Desktop IT cards now share heading, description and list rows. Increased small navigation and mobile footer touch targets, removed duplicate stylesheet requests and inline spacing overrides, and made breadcrumbs named navigation landmarks in both languages. Anchor navigation now uses one header offset instead of adding scroll padding and scroll margin together.

Validated all eight pages in Chromium at 15 widths from 320 to 1920 pixels (120 combinations), including both sides of responsive breakpoints. Checks cover horizontal overflow, shared container edges, header overlap, hero clearance, service numbers, photo rows, card alignment, mobile buttons, local files and anchors. Language/anchor switching, mobile focus/Escape/resize, invalid form input, clipboard success/failure and navigation without JavaScript passed. No page errors or failed resource responses occurred. Screenshots and results are in `.audit/`; this pass did not rerun axe-core or deploy the site.

Run the self-contained browser checks with `node tools/inspect-layout.cjs` when Playwright is installed, or pass the path to an existing Playwright package as the first argument. The script starts and closes its own local server.

## Page flow and hierarchy revision — 25 September 2026

The homepage now introduces services immediately after the hero, followed by supporting photography, the company introduction, the working approach, complementary digital services and a final contact invitation. The useful focus explanation is incorporated into the company introduction instead of repeating a separate contact section. The hero's primary action jumps to the services overview, and the ambiguous `01–03` metric is now labeled as three food technology services.

The services page groups food consulting and its engagement process before supporting photography and digital services. About places working principles before supporting photography. Inner-page breadcrumbs precede the title. Photo-and-text sections introduce their subject before the image in source order. Digital cards present their title and explanation before their diagram. The contact form precedes direct contact details, with aligned column headings and panels on desktop and compact details on mobile. Form labels, field spacing, mobile service indentation, diagram text and footer reading order have also been refined.

Fixed keyboard focus loss when an open mobile menu transitions to desktop. Invalid contact fields now receive accessible error state, native validation and focus; whitespace-only values are rejected, and editing clears stale feedback. The email fallback is a working link. Contact still prepares an email draft and does not send mail itself.

Revalidated all 120 Chromium layouts and interaction/resource checks after these changes. Added checks for translation catalog coverage, contact-panel alignment, clipped diagram labels, menu focus restoration and form error recovery. This is a local revision, with no deployment or claim that all possible browser issues have been eliminated.

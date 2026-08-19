/* ==========================================================================
   KIDEX — script.js
   Vanilla JS only. No dependencies, no build step.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Sticky header: add solid background once the page has scrolled
  --------------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 24) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------------------------------------------------------------------
     Mobile menu
  --------------------------------------------------------------------- */
  var hamburger = document.querySelector(".hamburger");
  var mobilePanel = document.querySelector(".mobile-panel");

  function closeMenu() {
    if (!mobilePanel) return;
    mobilePanel.classList.remove("is-open");
    hamburger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  function openMenu() {
    if (!mobilePanel) return;
    mobilePanel.classList.add("is-open");
    hamburger.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
  }

  if (hamburger && mobilePanel) {
    hamburger.addEventListener("click", function () {
      var isOpen = hamburger.getAttribute("aria-expanded") === "true";
      if (isOpen) { closeMenu(); } else { openMenu(); }
    });

    mobilePanel.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------------------------------------------------------------------
     Scroll-triggered reveal animations
  --------------------------------------------------------------------- */
  var revealTargets = document.querySelectorAll(".reveal, .reveal-stagger");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Current year in footer
  --------------------------------------------------------------------- */
  var yearEls = document.querySelectorAll("[data-year]");
  yearEls.forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------------------
     Contact form
     Static site: no backend. Opens the visitor's email client pre-filled
     with the message via a mailto: link. Replace CONTACT_EMAIL below with
     the real KIDEX address before launch.
  --------------------------------------------------------------------- */
  var CONTACT_EMAIL = ""; /* TODO: add the KIDEX contact email address */

  var contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var status = contactForm.querySelector(".form-status");
      var name = contactForm.querySelector("#cf-name").value.trim();
      var email = contactForm.querySelector("#cf-email").value.trim();
      var message = contactForm.querySelector("#cf-message").value.trim();

      if (!name || !email || !message) {
        if (status) status.textContent = "Please fill in every field before sending.";
        return;
      }

      if (!CONTACT_EMAIL) {
        if (status) {
          status.textContent = "This form isn't connected to an inbox yet — add a contact email in js/script.js.";
        }
        return;
      }

      var subject = encodeURIComponent("Website enquiry from " + name);
      var body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + subject + "&body=" + body;
      if (status) status.textContent = "Opening your email client…";
    });
  }
})();

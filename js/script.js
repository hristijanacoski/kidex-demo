/* KIDEX: progressive enhancement; content and language links work without JS. */
/**
 * Shared browser behavior for all eight static pages; no runtime dependencies.
 * Sections: translations, header, mobile menu, language picker, homepage showcase,
 * copyright year and contact form. Content and links remain usable without JS.
 * Optional components check for their markup before installing listeners.
 */
(function () {
  'use strict';
  // HTML is translated at build time; these messages are created by browser interactions.
  var mk = document.documentElement.lang === 'mk';
  var text = mk ? {
    open: 'Отвори мени', close: 'Затвори мени',
    required: 'Внесете ги вашето име, важечка е-пошта и порака.',
    draft: 'Се отвора нацрт во вашата апликација за е-пошта. Пораката сè уште не е испратена. Ако не се отвори, копирајте ја пораката и испратете ја на info@kidex.mk.',
    copied: 'Пораката е копирана. Залепете ја во е-пошта до info@kidex.mk.',
    copyFailed: 'Копирањето не е достапно. Изберете го текстот во полето за порака и копирајте го рачно.',
    subject: 'Прашање преку веб-страницата од ', name: 'Име', email: 'Е-пошта'
  } : {
    open: 'Open menu', close: 'Close menu',
    required: 'Enter your name, a valid email address and a message.',
    draft: 'Opening a draft in your email app. Your message has not been sent yet. If nothing opens, copy your message and email info@kidex.mk.',
    copied: 'Message copied. Paste it into an email to info@kidex.mk.',
    copyFailed: 'Copying is unavailable. Select the text in the message field and copy it manually.',
    subject: 'Website enquiry from ', name: 'Name', email: 'Email'
  };
  var header = document.querySelector('.site-header');
  var headerScrolled = null;
  // Update the class only when crossing the shadow threshold, not on every scroll event.
  function onScroll() {
    var scrolled = window.scrollY > 24;
    if (scrolled === headerScrolled) return;
    headerScrolled = scrolled;
    header.classList.toggle('is-scrolled', scrolled);
  }
  if (header) {
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Mobile navigation: synchronize visibility, accessibility state and keyboard focus.
  var button = document.querySelector('.hamburger');
  var panel = document.querySelector('.mobile-panel');
  var main = document.querySelector('main');
  var footer = document.querySelector('.site-footer');
  function setMenu(open, returnFocus) {
    if (!button || !panel) return;
    if (open) setLanguageMenu(false, false);
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? text.close : text.open);
    document.body.classList.toggle('menu-open', open);
    // Inert blocks keyboard and assistive-technology access to content behind the menu.
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (open) panel.querySelector('a').focus();
    else if (returnFocus) button.focus();
  }
  if (button && panel) {
    var desktopNav = document.querySelector('.main-nav');
    var lastFocusedDesktopLink = null;
    // Remember desktop focus so resizing never strands focus in hidden navigation.
    document.addEventListener('focusin', function (event) {
      lastFocusedDesktopLink = desktopNav && desktopNav.contains(event.target) ? event.target : null;
    });
    document.addEventListener('pointerdown', function (event) {
      if (!desktopNav || !desktopNav.contains(event.target)) lastFocusedDesktopLink = null;
    });
    button.addEventListener('click', function () { setMenu(button.getAttribute('aria-expanded') !== 'true', true); });
    panel.querySelectorAll('a').forEach(function (link) { link.addEventListener('click', function () { setMenu(false, false); }); });
    document.addEventListener('keydown', function (event) {
      if (button.getAttribute('aria-expanded') !== 'true') return;
      if (event.key === 'Escape') { event.preventDefault(); setMenu(false, true); }
      if (event.key === 'Tab') {
        // Include visible header controls as well as menu links in the keyboard loop.
        var nodes = Array.from(document.querySelectorAll('.site-header a, .site-header button, .mobile-panel a')).filter(function (el) { return el.getClientRects().length > 0; });
        var first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (event) {
      if (!event.matches) {
        if (lastFocusedDesktopLink || (desktopNav && desktopNav.contains(document.activeElement))) button.focus();
        return;
      }
      var restoreFocus = panel.contains(document.activeElement) || document.activeElement === button;
      setMenu(false, false);
      if (restoreFocus) {
        var destination = document.querySelector('.main-nav a[aria-current="page"]') || document.querySelector('.brand');
        if (destination) destination.focus();
      }
    });
    // pageshow also runs when Back/Forward restores a page from the browser cache.
    window.addEventListener('pageshow', function () { setMenu(false, false); });
    // CSS uses this class to replace the no-JS navigation with the mobile drawer.
    if (header) header.classList.add('nav-ready');
  }
  // Preserve service anchors across languages; cache these static links once.
  var languageLinks = Array.from(document.querySelectorAll('.language-switch a'));
  function syncLanguageLinks() {
    languageLinks.forEach(function (link) { link.hash = window.location.hash; });
  }
  syncLanguageLinks();
  window.addEventListener('hashchange', syncLanguageLinks);
  window.addEventListener('pageshow', syncLanguageLinks);
  var languageSwitch = document.querySelector('.language-switch');
  var languageToggle = document.querySelector('.language-toggle');
  var languageOptions = document.querySelector('.language-options');
  var mobileLanguage = window.matchMedia('(max-width: 860px)');
  // These links form a dropdown on mobile and stay visible on desktop.
  function setLanguageMenu(open, moveFocus) {
    if (!languageToggle || !languageOptions) return;
    open = open && mobileLanguage.matches;
    languageToggle.setAttribute('aria-expanded', String(open));
    languageOptions.hidden = mobileLanguage.matches && !open;
    if (moveFocus) {
      var target = open ? languageOptions.querySelector('a[aria-current]') : languageToggle;
      if (target) target.focus();
    }
  }
  if (languageSwitch && languageToggle && languageOptions) {
    // Derive the selected flag/code from aria-current so both languages share the logic.
    var currentLanguage = languageOptions.querySelector('a[aria-current]');
    var currentFlag = currentLanguage.querySelector('.language-flag');
    if (currentFlag) languageToggle.prepend(currentFlag.cloneNode(true));
    languageToggle.querySelector('[data-language-current]').textContent = currentLanguage.querySelector('.language-code').textContent;
    languageToggle.setAttribute('aria-label', languageToggle.getAttribute('aria-label') + ': ' + currentLanguage.getAttribute('aria-label'));
    languageToggle.hidden = false;
    languageSwitch.classList.add('is-enhanced');
    setLanguageMenu(false, false);
    languageToggle.addEventListener('click', function () {
      var open = languageToggle.getAttribute('aria-expanded') !== 'true';
      if (open) setMenu(false, false);
      setLanguageMenu(open, open);
    });
    languageSwitch.addEventListener('keydown', function (event) {
      if (!mobileLanguage.matches) return;
      var open = languageToggle.getAttribute('aria-expanded') === 'true';
      if (event.key === 'Escape' && open) {
        event.preventDefault(); setLanguageMenu(false, true);
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        var links = languageLinks;
        var index = links.indexOf(document.activeElement);
        setMenu(false, false);
        setLanguageMenu(true, false);
        var next = index < 0 ? (event.key === 'ArrowDown' ? 0 : links.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links[next].focus();
      }
    });
    // Dismiss outside the picker without moving keyboard focus unnecessarily.
    document.addEventListener('pointerdown', function (event) {
      if (!languageSwitch.contains(event.target)) setLanguageMenu(false, languageOptions.contains(document.activeElement));
    });
    document.addEventListener('focusin', function (event) {
      if (!languageSwitch.contains(event.target)) setLanguageMenu(false, false);
    });
    mobileLanguage.addEventListener('change', function () {
      // Focus the equivalent visible control across the 860px breakpoint.
      var restore = languageSwitch.contains(document.activeElement);
      setLanguageMenu(false, false);
      if (restore) (mobileLanguage.matches ? languageToggle : currentLanguage).focus();
    });
    window.addEventListener('pageshow', function () { setLanguageMenu(false, false); });
  }
  // Homepage: turn the static showcase into accessible, manually controlled tabs.
  var showcase = document.querySelector('.work-showcase');
  if (showcase) {
    var tabs = Array.from(showcase.querySelectorAll('.showcase-tab'));
    var slides = Array.from(showcase.querySelectorAll('.showcase-slide'));
    var tabList = showcase.querySelector('.showcase-tabs');
    var stage = showcase.querySelector('.showcase-stage');
    var controls = showcase.querySelector('.showcase-controls');
    var current = showcase.querySelector('[data-showcase-current]');
    var compactShowcase = window.matchMedia('(max-width: 860px)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var selected = 0;
    // Tabs, arrow buttons and swipes share this state transition.
    function selectSlide(next, focusTab) {
      // Wrap in either direction and move focus out of a slide that is being hidden.
      next = (next + slides.length) % slides.length;
      var focusInOldSlide = slides[selected].contains(document.activeElement);
      selected = next;
      tabs.forEach(function (tab, index) {
        var active = index === selected;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        slides[index].classList.toggle('is-active', active);
        slides[index].setAttribute('aria-hidden', String(!active));
        slides[index].inert = !active;
      });
      current.textContent = String(selected + 1).padStart(2, '0');
      controls.style.setProperty('--showcase-progress', ((selected + 1) / slides.length * 100) + '%');
      if (focusTab || focusInOldSlide) tabs[selected].focus({ preventScroll: true });
    }
    tabList.setAttribute('role', 'tablist');
    // Arrow-key directions follow the visual orientation of the tabs.
    function orientTabs() { tabList.setAttribute('aria-orientation', compactShowcase.matches ? 'horizontal' : 'vertical'); }
    orientTabs();
    compactShowcase.addEventListener('change', orientTabs);
    tabs.forEach(function (tab, index) {
      tab.setAttribute('role', 'tab');
      var title = tab.querySelector('.showcase-tab-title');
      title.id = tab.id + '-title';
      tab.setAttribute('aria-labelledby', title.id);
      slides[index].setAttribute('role', 'tabpanel');
      slides[index].setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', function () { selectSlide(index, false); });
      tab.addEventListener('keydown', function (event) {
        var next = index;
        var forward = compactShowcase.matches ? 'ArrowRight' : 'ArrowDown';
        var back = compactShowcase.matches ? 'ArrowLeft' : 'ArrowUp';
        if (event.key === forward) next++;
        else if (event.key === back) next--;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectSlide(next, true);
      });
    });
    showcase.querySelector('.showcase-prev').addEventListener('click', function () { selectSlide(selected - 1, false); });
    showcase.querySelector('.showcase-next').addEventListener('click', function () { selectSlide(selected + 1, false); });
    var swipeStart = null;
    var ignoreClickUntil = 0;
    stage.addEventListener('pointerdown', function (event) {
      if (event.pointerType === 'mouse' || !event.isPrimary) return;
      swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY };
    });
    window.addEventListener('pointerup', function (event) {
      if (!swipeStart || swipeStart.id !== event.pointerId) return;
      var dx = event.clientX - swipeStart.x;
      var dy = event.clientY - swipeStart.y;
      swipeStart = null;
      // Deliberate horizontal swipes change slides; vertical gestures keep scrolling.
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        ignoreClickUntil = Date.now() + 400;
        selectSlide(selected + (dx < 0 ? 1 : -1), false);
      }
    });
    window.addEventListener('pointercancel', function () { swipeStart = null; });
    stage.addEventListener('click', function (event) {
      // Suppress the synthetic click after swiping so it cannot open the slide's link.
      if (Date.now() < ignoreClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    selectSlide(0, false);
    showcase.classList.add('is-enhanced');
    tabList.hidden = false;
    controls.hidden = false;
    // Play the decorative arrival once, respecting reduced-motion preferences.
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      var arrival = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        showcase.classList.add('has-entered');
        arrival.disconnect();
      }, { threshold: 0.15 });
      arrival.observe(showcase);
    }
  }
  // Keep the copyright year current without a yearly rebuild.
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  // Contact page only: create an email draft, never send or store submissions.
  var form = document.querySelector('#contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var fields = [form.elements.name, form.elements.email, form.elements.message];
  // Native invalid events do not bubble; capture them to announce field failures.
  form.addEventListener('invalid', function (event) {
    event.target.setAttribute('aria-invalid', 'true');
    status.classList.add('is-error');
    status.textContent = text.required;
  }, true);
  fields.forEach(function (field) {
    field.addEventListener('input', function () {
      field.setCustomValidity('');
      field.removeAttribute('aria-invalid');
      status.classList.remove('is-error');
      status.textContent = '';
    });
  });
  // Share validation and formatting between the draft and clipboard actions.
  function messageData() {
    // Native required validation accepts spaces; explicitly reject whitespace-only input.
    fields.forEach(function (field) {
      field.setCustomValidity(field.value.trim() ? '' : text.required);
    });
    if (!form.reportValidity()) return null;
    status.classList.remove('is-error');
    fields.forEach(function (field) { field.removeAttribute('aria-invalid'); });
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var message = form.elements.message.value.trim();
    return { subject: text.subject + name, body: message + '\n\n' + text.name + ': ' + name + '\n' + text.email + ': ' + email };
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = messageData();
    if (!data) return;
    status.textContent = text.draft;
    // Encode &, ?, + and line breaks so user text cannot alter the mailto parameters.
    window.location.href = 'mailto:info@kidex.mk?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(data.body);
  });
  form.querySelector('.copy-message').addEventListener('click', async function () {
    var data = messageData();
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.subject + '\n\n' + data.body);
      status.textContent = text.copied;
    } catch (_) {
      // HTTP or browser permissions may block the clipboard; select text for manual copying.
      status.textContent = text.copyFailed;
      form.elements.message.focus();
      form.elements.message.select();
    }
  });
})();

/* KIDEX: progressive enhancement; content and language links work without JS. */
(function () {
  'use strict';
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
  function onScroll() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 24); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  var button = document.querySelector('.hamburger');
  var panel = document.querySelector('.mobile-panel');
  var main = document.querySelector('main');
  var footer = document.querySelector('.site-footer');
  function setMenu(open, returnFocus) {
    if (!button || !panel) return;
    panel.classList.toggle('is-open', open);
    panel.inert = !open;
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? text.close : text.open);
    document.body.classList.toggle('menu-open', open);
    if (main) main.inert = open;
    if (footer) footer.inert = open;
    if (open) panel.querySelector('a').focus();
    else if (returnFocus) button.focus();
  }
  if (button && panel) {
    var desktopNav = document.querySelector('.main-nav');
    var lastFocusedDesktopLink = null;
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
    window.addEventListener('pageshow', function () { setMenu(false, false); });
    if (header) header.classList.add('nav-ready');
  }
  function syncLanguageLinks() {
    document.querySelectorAll('.language-switch a').forEach(function (link) { link.hash = window.location.hash; });
  }
  syncLanguageLinks();
  window.addEventListener('hashchange', syncLanguageLinks);
  window.addEventListener('pageshow', syncLanguageLinks);
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
    function selectSlide(next, focusTab) {
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
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        ignoreClickUntil = Date.now() + 400;
        selectSlide(selected + (dx < 0 ? 1 : -1), false);
      }
    });
    window.addEventListener('pointercancel', function () { swipeStart = null; });
    stage.addEventListener('click', function (event) {
      if (Date.now() < ignoreClickUntil) { event.preventDefault(); event.stopPropagation(); }
    }, true);
    selectSlide(0, false);
    showcase.classList.add('is-enhanced');
    tabList.hidden = false;
    controls.hidden = false;
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      var arrival = new IntersectionObserver(function (entries) {
        if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
        showcase.classList.add('has-entered');
        arrival.disconnect();
      }, { threshold: 0.15 });
      arrival.observe(showcase);
    }
  }
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  var form = document.querySelector('#contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var fields = [form.elements.name, form.elements.email, form.elements.message];
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
  function messageData() {
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
    window.location.href = 'mailto:info@kidex.mk?subject=' + encodeURIComponent(data.subject) + '&body=' + encodeURIComponent(data.body);
  });
  form.querySelector('.copy-message').addEventListener('click', async function () {
    var data = messageData();
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.subject + '\n\n' + data.body);
      status.textContent = text.copied;
    } catch (_) {
      status.textContent = text.copyFailed;
      form.elements.message.focus();
      form.elements.message.select();
    }
  });
})();

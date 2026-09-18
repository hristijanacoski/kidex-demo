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
    window.matchMedia('(min-width: 861px)').addEventListener('change', function (event) { if (event.matches) setMenu(false, false); });
    window.addEventListener('pageshow', function () { setMenu(false, false); });
  }
  document.querySelectorAll('.language-switch a').forEach(function (link) {
    link.addEventListener('click', function () { if (window.location.hash) link.hash = window.location.hash; });
  });
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  var form = document.querySelector('#contact-form');
  if (!form) return;
  var status = form.querySelector('.form-status');
  function messageData() {
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var message = form.elements.message.value.trim();
    if (!name || !email || !message || !form.reportValidity()) {
      status.textContent = text.required;
      if (!name) form.elements.name.focus();
      else if (!message) form.elements.message.focus();
      return null;
    }
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

/* PDF previews are loaded only on request. Static links remain usable without JS. */
(function () {
  'use strict';
  var dialog = document.querySelector('[data-project-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  var frame = dialog.querySelector('[data-project-frame]');
  var heading = dialog.querySelector('#project-dialog-title');
  var opener;
  document.querySelectorAll('[data-project-preview]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      // Preserve open-in-new-tab and download gestures.
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      opener = link;
      heading.textContent = link.dataset.projectTitle;
      dialog.querySelector('[data-project-open]').href = link.href;
      dialog.querySelector('[data-project-download]').href = link.href;
      var iframe = document.createElement('iframe');
      iframe.title = heading.textContent;
      iframe.src = link.href;
      frame.replaceChildren(iframe);
      dialog.showModal();
      document.body.classList.add('project-preview-open');
    });
  });
  dialog.querySelector('[data-project-close]').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (event) {
    var bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  // Native dialog supplies focus containment and Escape. Release the PDF and
  // return focus when any close path runs, including Escape and the backdrop.
  dialog.addEventListener('close', function () {
    frame.replaceChildren();
    document.body.classList.remove('project-preview-open');
    if (opener && opener.isConnected) opener.focus();
  });
})();

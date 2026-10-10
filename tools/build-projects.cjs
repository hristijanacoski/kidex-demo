/**
 * Build the bilingual project library using only Node's standard library.
 * Run: node tools/build-projects.cjs
 * Project content comes from data/projects.json. Header/footer come from Contact
 * so shared navigation stays consistent. Draft records never reach public HTML.
 */
const fs = require('node:fs');
const path = require('node:path');

const copy = {
  en: {
    name:'Projects', title:'Projects - KIDEX', description:'Explore projects supported by KIDEX, with project reports and presentations to preview and download.',
    eyebrow:'Experience in practice', heading:'Our work, documented.', intro:'A closer look at the projects, events and collaborations where KIDEX contributes practical knowledge.',
    library:'Project library', libraryIntro:'Explore our involvement and read the story behind each project.',
    report:'Project report', role:'Our role', preview:'Preview report', download:'Download', powerpoint:'PowerPoint',
    emptyTitle:'New project stories are on their way.', emptyText:'We are preparing reports and presentations from our work. Visit again soon to explore them.',
    contact:'Talk to us about a project', close:'Close preview', open:'Open PDF in a new tab', help:'If the preview does not appear on your device, open the PDF in a new tab or download it.',
    home:'Home', pdfTitle:'Project document preview'
  },
  mk: {
    name:'Проекти', title:'Проекти - KIDEX', description:'Запознајте ги проектите во кои учествува KIDEX. Прегледајте и преземете извештаи и презентации.',
    eyebrow:'Искуство во практика', heading:'Нашата работа низ проекти.', intro:'Запознајте ги проектите, настаните и соработките во кои KIDEX придонесува со практично знаење.',
    library:'Нашите проекти', libraryIntro:'Дознајте повеќе за нашата улога и за секој проект.',
    report:'Извештај за проектот', role:'Нашата улога', preview:'Прегледајте го извештајот', download:'Преземете', powerpoint:'PowerPoint',
    emptyTitle:'Наскоро ќе ги претставиме нашите проекти.', emptyText:'Подготвуваме извештаи и презентации од нашата работа. Посетете нè повторно за да ги разгледате.',
    contact:'Разговарајте со нас за проект', close:'Затворете го прегледот', open:'Отворете го PDF-документот во ново јазиче', help:'Ако прегледот не се прикажува на вашиот уред, отворете го PDF-документот во ново јазиче или преземете го.',
    home:'Почетна', pdfTitle:'Преглед на документ за проект'
  }
};
const escape = value => String(value).replace(/[&<>"']/g, char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = '<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H5v20h14V7l-5-5ZM14 2v6h5M8 12h8M8 16h6"/></svg>';

function localized(value, label, optional=false) {
  if (optional && value == null) return;
  for (const lang of ['en','mk']) {
    if (!value || typeof value[lang] !== 'string' || !value[lang].trim()) throw new Error(`${label}: provide both en and mk text`);
    if (value[lang].length > 1600) throw new Error(`${label}: text exceeds 1600 characters`);
  }
}

function publicFile(root, value, extensions, folder) {
  // Only local files in dedicated public folders are accepted. Reject schemes,
  // traversal, query strings, and symlinks pointing outside the allowed folder.
  if (typeof value !== 'string' || !/^[a-zA-Z0-9/_\-.]+$/.test(value) || value.split('/').some(p=>p==='..'||p==='.') || !value.startsWith(folder+'/')) throw new Error(`Invalid public file: ${value}`);
  const extension = path.extname(value).toLowerCase();
  if (!extensions.includes(extension)) throw new Error(`Unsupported file type: ${value}`);
  const file = path.resolve(root,value);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new Error(`Missing file: ${value}`);
  const boundary = path.resolve(root,folder)+path.sep;
  if (!fs.realpathSync(file).startsWith(boundary)) throw new Error(`File escapes public folder: ${value}`);
  const bytes = fs.statSync(file).size;
  if (!bytes || bytes > 50*1024*1024) throw new Error(`File must be between 1 byte and 50 MB: ${value}`);
  const signature = Buffer.alloc(5);
  const fd = fs.openSync(file,'r');
  try { fs.readSync(fd,signature,0,5,0); } finally { fs.closeSync(fd); }
  if (extension === '.pdf' && signature.toString() !== '%PDF-') throw new Error(`Not a PDF file: ${value}`);
  if (extension === '.pptx' && signature.subarray(0,2).toString() !== 'PK') throw new Error(`Not a PowerPoint package: ${value}`);
  if (extension === '.ppt' && signature.subarray(0,4).toString('hex') !== 'd0cf11e0') throw new Error(`Not a PowerPoint file: ${value}`);
  return {file:value,extension,bytes};
}

function readProjects(root) {
  const data=JSON.parse(fs.readFileSync(path.join(root,'data/projects.json'),'utf8'));
  if (data.schemaVersion!==1 || !Array.isArray(data.projects)) throw new Error('Expected schemaVersion: 1 and a projects array');
  const ids=new Set();
  return data.projects.flatMap(project=>{
    if (!project || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id) || ids.has(project.id)) throw new Error('Each project needs a unique lowercase hyphenated id');
    ids.add(project.id);
    if (typeof project.published !== 'boolean') throw new Error(`${project.id}: published must be true or false`);
    if (!project.published) return []; // Drafts may still have placeholder dates and missing documents.
    localized(project.title,'title'); localized(project.summary,'summary'); localized(project.role,'role'); localized(project.location,'location',true);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(project.date) || !Number.isFinite(Date.parse(project.date)) || new Date(project.date).toISOString().slice(0,10)!==project.date) throw new Error(`${project.id}: use a real event date in YYYY-MM-DD format`);
    if (!Array.isArray(project.documents)||!project.documents.length) throw new Error(`${project.id}: add at least one document`);
    const documents=project.documents.map(doc=>publicFile(root,doc.file,['.pdf','.ppt','.pptx'],'documents/projects'));
    if (new Set(documents.map(doc=>doc.file)).size!==documents.length) throw new Error(`${project.id}: duplicate document`);
    // Browsers cannot reliably render PowerPoint locally. A PDF export provides
    // a private, first-party preview while the original presentation is downloadable.
    const preview=project.preview ? publicFile(root,project.preview,['.pdf'],'documents/projects') : documents.find(doc=>doc.extension==='.pdf');
    if (!preview) throw new Error(`${project.id}: include a PDF export for preview (documents or preview field)`);
    const cover=project.cover ? publicFile(root,project.cover,['.webp','.jpg','.jpeg','.png'],'images/projects') : null;
    return [{...project,documents,preview,cover}];
  }).sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}

function size(bytes,lang) {
  const value=bytes<1024*1024 ? Math.max(1,Math.round(bytes/1024)) : bytes/1024/1024;
  return new Intl.NumberFormat(lang,{maximumFractionDigits:1}).format(value)+' '+(bytes<1024*1024?'KB':'MB');
}

function content(projects,lang) {
  const t=copy[lang], prefix=lang==='mk'?'../':'';
  const cards=projects.map(project=>{
    const title=escape(project.title[lang]);
    const date=new Intl.DateTimeFormat(lang==='mk'?'mk-MK':'en-GB',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(project.date));
    const preview=`${prefix}${project.preview.file}`;
    const cover=project.cover ? `<img src="${escape(prefix+project.cover.file)}" alt="" loading="lazy" decoding="async">` : `<div class="project-paper">${icon}<span>${escape(t.report)}</span><strong>${title}</strong><span class="project-paper-brand">KIDEX / ${project.date.slice(0,4)}</span></div>`;
    const downloads=project.documents.map(doc=>`<a class="project-download" href="${escape(prefix+doc.file)}" download>${escape(t.download)} ${doc.extension==='.pdf'?'PDF':t.powerpoint}<span>${size(doc.bytes,lang)}</span><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></svg></a>`).join('');
    return `<article class="project-card" id="project-${escape(project.id)}" aria-labelledby="title-project-${project.id}">
      <a class="project-cover" href="${escape(preview)}" data-project-preview data-project-title="${title}" aria-label="${escape(t.preview)}: ${title}">${cover}<span class="project-cover-label">PDF</span></a>
      <div class="project-card-body"><div class="project-meta"><time datetime="${project.date}">${escape(date)}</time>${project.location?`<span>${escape(project.location[lang])}</span>`:''}</div>
      <h3 id="title-project-${project.id}">${title}</h3><p>${escape(project.summary[lang])}</p>
      <dl class="project-role"><dt>${escape(t.role)}</dt><dd>${escape(project.role[lang])}</dd></dl>
      <a class="btn btn-dark project-preview-link" href="${escape(preview)}" data-project-preview data-project-title="${title}">${icon}${escape(t.preview)}</a>
      <div class="project-downloads">${downloads}</div></div>
    </article>`;
  }).join('\n');
  return `<main id="main" tabindex="-1">
    <section class="page-hero projects-hero" aria-labelledby="projects-title"><div class="container">
      <nav aria-label="${lang==='mk'?'Патека':'Breadcrumb'}" class="breadcrumb"><a href="index.html">${t.home}</a><span aria-hidden="true">/</span><span aria-current="page">${t.name}</span></nav>
      <div class="projects-intro"><div><span class="eyebrow">${t.eyebrow}</span><h1 id="projects-title">${t.heading}</h1><p>${t.intro}</p></div><div class="projects-emblem" aria-hidden="true">${icon}<span>KIDEX</span></div></div>
    </div></section>
    <section class="on-light projects-library" aria-labelledby="project-library-title"><div class="container">
      <div class="projects-library-heading"><h2 id="project-library-title">${t.library}</h2><p>${t.libraryIntro}</p></div>
      ${cards?`<div class="project-grid">${cards}</div>`:`<div class="projects-empty">${icon}<h3>${t.emptyTitle}</h3><p>${t.emptyText}</p><a class="btn btn-dark" href="contact.html">${t.contact}</a></div>`}
    </div></section>
  </main>
  <!-- Progressive enhancement: without JavaScript, preview links open the PDF directly. -->
  <dialog class="project-dialog" aria-labelledby="project-dialog-title" data-project-dialog>
    <div class="project-dialog-bar"><h2 id="project-dialog-title">${t.pdfTitle}</h2><button type="button" class="project-dialog-close" data-project-close autofocus aria-label="${t.close}"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <div class="project-dialog-tools"><a data-project-open target="_blank" rel="noopener">${t.open}</a><a data-project-download download>${t.download} PDF</a></div>
    <p class="project-dialog-help">${t.help}</p><div class="project-document-frame" data-project-frame></div>
  </dialog>`;
}

function build(root=path.resolve(__dirname,'..')) {
  const projects=readProjects(root); // Validate everything before overwriting either page.
  const outputs=[];
  for (const lang of ['en','mk']) {
    const prefix=lang==='mk'?'mk/':'';
    const t=copy[lang];
    let html=fs.readFileSync(path.join(root,prefix+'contact.html'),'utf8');
    html=html.replace(/<title>[\s\S]*?<\/title>/,`<title>${t.title}</title>`)
      .replace(/<meta content="[^"]*" name="description">/,`<meta content="${escape(t.description)}" name="description">`)
      .replace(/<meta content="[^"]*" property="og:title">/,`<meta content="${t.title}" property="og:title">`)
      .replace(/<meta content="[^"]*" property="og:description">/,`<meta content="${escape(t.description)}" property="og:description">`)
      .replace(/https?:\/\/[^"<\s]+\/contact\.html/g,url=>url.replace(/contact\.html$/,'projects.html'))
      .replace('class="page-contact"','class="page-projects"')
      .replace(/<main\b[\s\S]*?<\/main>/,content(projects,lang));
    // Only current navigation and language links change; contact CTAs stay intact.
    html=html.replace(/<a aria-current="page" href="contact.html">/g,'<a href="contact.html">')
      .replaceAll(`<a href="projects.html">${t.name}</a>`,`<a aria-current="page" href="projects.html">${t.name}</a>`)
      .replace(/<a\b[^>]*hreflang="(?:en|mk)"[^>]*>/g,tag=>tag.replace(/href="[^"]*"/,`href="${tag.includes('hreflang="mk"')?(lang==='mk'?'projects.html':'mk/projects.html'):(lang==='mk'?'../projects.html':'projects.html')}"`))
      .replace(/(<script src="(?:\.\.\/)?js\/script.js[^>]*><\/script>)/,`$1\n    <script src="${lang==='mk'?'../':''}js/projects.js?v=1"></script>`);
    outputs.push([path.join(root,prefix+'projects.html'),html]);
  }
  outputs.forEach(([file,html])=>fs.writeFileSync(file,html));
  return projects.length;
}
if (require.main===module) console.log(`Built English and Macedonian Projects pages: ${build()} published projects.`);
module.exports={build,readProjects,content,copy};

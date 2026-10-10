// Run with Playwright installed, or pass its module path as the first argument.
// All fixtures stay under .audit; the public project manifest is never modified.
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require(process.argv[2]||'playwright');
const {build,readProjects}=require('./build-projects.cjs');
const root=path.resolve(__dirname,'..');
const fixture=fs.mkdtempSync(path.join(root,'.audit/projects-check-'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.pptx':'application/vnd.openxmlformats-officedocument.presentationml.presentation','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml'};
for(const directory of ['data','documents/projects','mk'])fs.mkdirSync(path.join(fixture,directory),{recursive:true});
for(const directory of ['css','js','images','favicon'])fs.cpSync(path.join(root,directory),path.join(fixture,directory),{recursive:true});
for(const lang of ['','mk/'])for(const name of ['index','about','services','contact'])fs.copyFileSync(path.join(root,lang+name+'.html'),path.join(fixture,lang+name+'.html'));
const manifest=projects=>fs.writeFileSync(path.join(fixture,'data/projects.json'),JSON.stringify({schemaVersion:1,projects}));
const project={id:'test-project',published:true,date:'2026-10-01',title:{en:'Test project & report',mk:'Пробен проект и извештај'},summary:{en:'A test of project publishing.',mk:'Проверка на објавувањето проекти.'},role:{en:'Consulting partner',mk:'Консултантски партнер'},location:{en:'Skopje',mk:'Скопје'},documents:[{file:'documents/projects/report.pdf'},{file:'documents/projects/slides.pptx'}]};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 const file=path.resolve(fixture,'.'+decodeURIComponent(url.pathname));
 if(!file.startsWith(fixture+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,data)=>{res.writeHead(err?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(err?'Not found':data);});
});
(async()=>{
 const browser=await chromium.launch();
 const page=await browser.newPage({reducedMotion:'reduce'});
 const checks=[];
 try{
  await page.setContent('<h1>Project preview test</h1><p>This is a test document, not a KIDEX project.</p>');
  await page.pdf({path:path.join(fixture,'documents/projects/report.pdf')});
  // A package-signature fixture exercises the original-file download path; the
  // site deliberately never parses or renders PowerPoint files in the browser.
  fs.writeFileSync(path.join(fixture,'documents/projects/slides.pptx'),Buffer.from('PK\x03\x04PROJECT-DOWNLOAD-TEST'));
  const valid=[project,{...project,id:'test-project-title',date:'2025-01-02'},{id:'private-draft',published:false,title:{en:'DO NOT PUBLISH'}}];
  manifest(valid);assert.equal(build(fixture),2);
  assert(!fs.readFileSync(path.join(fixture,'projects.html'),'utf8').includes('DO NOT PUBLISH'));
  checks.push('Draft exclusion and bilingual generation');
  // Business cards and other reference documents may have no event date.
  const undated={...project,id:'undated-document'};delete undated.date;
  manifest([undated,project]);assert.equal(build(fixture),2);
  assert.equal(readProjects(fixture)[0].id,project.id);
  for(const lang of ['','mk/']){
   const html=fs.readFileSync(path.join(fixture,lang+'projects.html'),'utf8');
   const card=html.match(/<article class="project-card" id="project-undated-document"[\s\S]*?<\/article>/)[0];
   assert(!card.includes('<time'));
   assert(!card.includes('undefined'));
  }
  checks.push('Undated documents render without fabricated dates and sort after dated projects');
  for(const [label,change] of [
   ['missing translation',p=>{p.title.mk='';}],['invalid date',p=>{p.date='2026-02-31';}],
   ['traversal',p=>{p.documents[0].file='documents/projects/../../contact.html';}],
   ['external document',p=>{p.documents[0].file='https://example.com/report.pdf';}],
   ['missing file',p=>{p.documents[0].file='documents/projects/missing.pdf';}],
   ['missing PDF export',p=>{p.documents=p.documents.slice(1);}],
   ['unsupported file',p=>{p.documents[0].file='documents/projects/program.exe';}]
  ]){const p=structuredClone(project);change(p);manifest([p]);assert.throws(()=>readProjects(fixture),undefined,label);checks.push('Reject '+label);}
  manifest([project,project]);assert.throws(()=>readProjects(fixture),/unique/);checks.push('Reject duplicate IDs');
  const injected={...project,title:{en:'<img src=x onerror=alert(1)>',mk:'<script>alert(1)</script>'}};
  manifest([injected]);build(fixture);assert(!fs.readFileSync(path.join(fixture,'projects.html'),'utf8').includes('<img src=x'));checks.push('Escape project content');
  manifest(valid);build(fixture);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}/`;
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  for(const lang of ['','mk/'])for(const width of [320,390,768,861,1101,1440]){
   await page.setViewportSize({width,height:900});await page.goto(base+lang+'projects.html');
   assert.equal(await page.locator('.project-card').count(),2);
   assert(await page.locator('[id]').evaluateAll(elements=>new Set(elements.map(el=>el.id)).size===elements.length),'Unique IDs across cards and document controls');
   assert.equal(await page.locator('.project-card').first().getAttribute('id'),'project-test-project');
   assert.equal(await page.locator('.project-cover').first().getAttribute('href'),(lang?'../':'')+'documents/projects/report.pdf');
   assert.equal(await page.locator('.language-switch [hreflang="en"]').evaluate(el=>el.href),base+'projects.html');
   assert.equal(await page.locator('.language-switch [hreflang="mk"]').evaluate(el=>el.href),base+'mk/projects.html');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No horizontal overflow');
   if(width>860)assert(await page.evaluate(()=>{const nav=document.querySelector('.main-nav').getBoundingClientRect(),actions=document.querySelector('.nav-actions').getBoundingClientRect(),brand=document.querySelector('.brand').getBoundingClientRect();return brand.right<=nav.left&&nav.right<=actions.left;}),'Header components do not overlap');
   if(width===390||width===1440)await page.screenshot({path:path.join(root,`.audit/projects-${lang?'mk':'en'}-${width}.png`),fullPage:true});
   checks.push(`${lang||'en'} ${width}px layout and language links`);
  }
  for(const lang of ['','mk/']){
   await page.goto(base+lang+'projects.html');
   await page.addScriptTag({path:path.join(root,'.audit/axe.min.js')});
   let accessibility=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));
   assert.deepEqual(accessibility,[],'Published-card accessibility');
   assert.equal(await page.locator('iframe').count(),0);
   const trigger=page.locator('.project-preview-link').first();
   await trigger.click();assert(await page.locator('dialog').isVisible());
   accessibility=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));
   assert.deepEqual(accessibility,[],'Preview-dialog accessibility');
   assert.equal(await page.locator('iframe').getAttribute('title'),project.title[lang?'mk':'en']);
   assert((await page.locator('iframe').getAttribute('src')).endsWith('/documents/projects/report.pdf'));
   assert(await page.locator('[data-project-close]').evaluate(el=>el===document.activeElement));
   await page.keyboard.press('Escape');assert(!await page.locator('dialog').isVisible());
   assert.equal(await page.locator('iframe').count(),0);assert(await trigger.evaluate(el=>el===document.activeElement));
   await trigger.click();await page.locator('[data-project-close]').click();assert(!await page.locator('dialog').isVisible());
   for(const filename of ['report.pdf','slides.pptx']){
    const pending=page.waitForEvent('download');await page.locator(`.project-download[href$="${filename}"]`).first().click();
    const download=await pending;assert.equal(download.suggestedFilename(),filename);assert.equal(await download.failure(),null);
   }
   await page.addStyleTag({content:'html { font-size:200%; }'});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   checks.push(`${lang||'en'} preview, Escape, focus restoration, PDF/PowerPoint downloads and enlarged text`);
  }
  const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
  const staticPage=await nojs.newPage();await staticPage.goto(base+'mk/projects.html');
  assert(await staticPage.locator('.project-preview-link').first().isVisible());
  assert.equal(await staticPage.locator('.project-download').count(),4);await nojs.close();checks.push('No-JavaScript preview and download links');
  manifest([]);build(fixture);await page.goto(base+'projects.html');assert(await page.locator('.projects-empty').isVisible());checks.push('Empty library');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(root,'.audit/projects-check.json'),JSON.stringify({checks,errors,fixture},null,2));
  console.log(`${checks.length} project checks passed. Fixtures: ${fixture}`);
 }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

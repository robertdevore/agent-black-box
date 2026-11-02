import {chromium,expect} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const timing=JSON.parse(await readFile(root+'/.tesseract-work/timing.json','utf8'));
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:root+'/.tesseract-work/capture',size:{width:1280,height:720}}});
const origin=performance.now();const page=await context.newPage();const errors=[];page.on('pageerror',e=>{if(page.url().startsWith('http://127.0.0.1'))errors.push(e.message)});
const current=()=>performance.now()-origin,wait=ms=>page.waitForTimeout(ms);
const scroll=async y=>{await page.evaluate(y=>scrollTo({top:y,behavior:'smooth'}),y);await wait(450)};
const showcase=pathToFileURL(root+'/showcase.html').href;
async function select(n){await page.locator(`[data-event="${n-1}"]`).click();await expect(page.locator('#timeline')).toHaveValue(String(n-1))}
async function importRun(){await page.getByRole('button',{name:'Import receipt'}).click();await page.locator('#file').setInputFiles(root+'/../real-world-explainer/evidence/recorded-run.json');await page.getByRole('button',{name:'Import and replay'}).click();await expect(page.locator('#title')).toHaveText('Fix blank SKUs in an inventory import');await page.getByRole('button',{name:'Dismiss notification'}).click()}
const chapters=[];let publicUrl;
try{
 await page.goto('http://127.0.0.1:4173');await importRun();await scroll(260);
 for(let i=0;i<timing.length;i++){
  const s=timing[i],start=current();console.log('Recording',s.id);
  async function at(f,action){await wait(Math.max(0,start+f*s.hold*1000-current()));await action()}
  if(i===0){await select(4);await at(.32,()=>select(8));await at(.62,()=>select(9));await at(.82,()=>select(1))}
  if(i===1){await page.goto(showcase+'#overview');await expect(page.getByText('Three apps. One useful replay.')).toBeVisible()}
  if(i===2){await page.goto('http://127.0.0.1:4173');await at(.08,()=>importRun());await at(.35,()=>scroll(260));await page.locator('#speed').selectOption('1');await page.getByRole('button',{name:'Play replay',exact:true}).click();await at(.72,async()=>{await page.getByRole('button',{name:'Pause replay'}).click();await select(4)})}
  if(i===3){await select(4);await at(.18,()=>page.locator('.inspector-body').evaluate(el=>el.scrollTo({top:370,behavior:'smooth'})));await at(.6,()=>page.locator('.inspector-body').evaluate(el=>el.scrollTo({top:900,behavior:'smooth'})));await at(.85,()=>page.locator('.inspector-body').evaluate(el=>el.scrollTo({top:el.scrollHeight,behavior:'smooth'})))}
  if(i===4){await select(7);await at(.14,()=>select(8));await at(.3,()=>page.locator('.inspector-body').evaluate(el=>el.scrollTo({top:350,behavior:'smooth'})))}
  if(i===5){await select(9);await at(.1,()=>page.locator('.inspector-body').evaluate(el=>el.scrollTo({top:350,behavior:'smooth'})));await at(.35,()=>select(10));await at(.6,()=>select(4));await at(.8,()=>select(11))}
  if(i===6){await scroll(0);await page.getByRole('button',{name:'Share report'}).click();await at(.23,()=>page.locator('#publish-preview').evaluate(el=>el.scrollTo({top:500,behavior:'smooth'})));await at(.4,()=>page.locator('#approve').check());await at(.5,async()=>{await page.getByRole('button',{name:'Publish approved report'}).click();publicUrl='http://127.0.0.1:4173'+await page.getByRole('link',{name:'Open public report'}).getAttribute('href');await page.goto(publicUrl);await expect(page.locator('#scenario')).not.toBeVisible();await select(9);await scroll(260)})}
  if(i===7){await page.goto(showcase+'#contracts');await expect(page.getByText('Contracts make the boundaries explicit.')).toBeVisible()}
  if(i===8){await page.goto(showcase+'#verified');await page.locator('.proof').evaluate(el=>el.scrollTop=el.scrollHeight);await expect(page.locator('.proof')).toContainText('real Worker service bindings and separate D1 survive independent studio code update')}
  if(i===9){await page.goto(publicUrl);await select(4);await scroll(260);await at(.25,()=>select(8));await at(.45,()=>page.locator('.inspector-body').evaluate(el=>el.scrollTo({top:350,behavior:'smooth'})));await at(.65,()=>select(9));await at(.85,async()=>{await select(11);await scroll(0)})}
  await page.screenshot({path:root+`/Previews/${s.id}.png`});await wait(Math.max(0,start+s.hold*1000-current()));chapters.push({...s,sourceStartMs:Math.round(start),sourceDurationMs:Math.round(current()-start)})
 }
 const anon=await browser.newContext();const p=await anon.newPage();await p.goto(publicUrl);await expect(p.locator('#title')).toHaveText('Fix blank SKUs in an inventory import');await expect(p.locator('#scenario')).not.toBeVisible();await expect(p.getByRole('button',{name:'Share report'})).not.toBeVisible();await anon.close();
 const video=page.video();await context.close();await video.saveAs(root+'/assets/screen-recording.webm');await writeFile(root+'/.tesseract-work/capture-timing.json',JSON.stringify(chapters,null,2));await writeFile(root+'/evidence/browser-check.json',JSON.stringify({chapterCount:chapters.length,pageErrors:errors,graphTimelineAssertionsPassed:true,anonymousReportPassed:true,composerWebsiteRecorded:false,composerShowcase:'repository-backed architecture, manifest and verification views',sourceWalkthrough:'actual manifests and executed test output'},null,2));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close()}

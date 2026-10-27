import {_electron as electron} from '@playwright/test';
import {writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
const stages=[['Paste an existing script.','Scene headings, characters and dialogue are recognized automatically.','paste-script'],['Keep the words. Find the format.','Review the formatted draft, then keep writing.','formatted-script'],['Stay in the scene.','Focus mode clears the writing room.','focus-mode'],['Bring a PDF back to the page.','Import selectable PDF text and continue editing. Scans need OCR first.','pdf-import'],['Send the draft on its way.','Export PDF, Fountain or a complete FreeScript backup.','export-options']];
const app=await electron.launch({args:[resolve('branding/scripts/render-main.cjs')]});
try{
 const page=await app.firstWindow();
 for(let i=0;i<stages.length;i++){
  const [title,subtitle,shot]=stages[i];
  const body=`<!doctype html><html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;background:#f7f2e8;color:#342f29;font-family:'Courier New',Courier,monospace;padding:65px 75px;display:flex;flex-direction:column}header{display:flex;justify-content:space-between;border-bottom:1px solid #cfc4b2;padding-bottom:25px;font-size:22px;letter-spacing:2px}.main{display:grid;grid-template-columns:470px 1fr;align-items:center;gap:60px;flex:1}h1{font:66px/1.12 'Courier New';letter-spacing:-3px}p{font-size:26px;line-height:1.6}.main img{width:100%;max-height:820px;object-fit:contain;border:1px solid #cfc4b2;box-shadow:0 12px 40px #342f2910}footer{display:flex;justify-content:space-between;font-size:17px;letter-spacing:1px}</style><body><header><strong>FreeScript</strong><span>THE WRITING ROOM / ${String(i+1).padStart(2,'0')}</span></header><main class="main"><div><h1>${title}</h1><p>${subtitle}</p></div><img src="../screenshots/${shot}.png" alt="Actual FreeScript app capture"></main><footer><span>ACTUAL APP CAPTURES · FICTIONAL SAMPLE WRITING</span><span>YOUR STORY. YOUR PAGE.</span></footer></body></html>`;
  await writeFile(`branding/promotional/workflow-${i+1}.html`,body);
  await page.setViewportSize({width:1920,height:1080});
  await page.goto('file://'+resolve(`branding/promotional/workflow-${i+1}.html`));
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:`branding/promotional/workflow-${i+1}.png`,scale:'css'});
 }
 const clips=[['banner',3],['workflow-1',5],['workflow-2',5],['workflow-3',4],['workflow-4',5],['workflow-5',5],['end-card',4]];
 await writeFile('branding/video/workflow-list.txt',clips.map(([n,t])=>`file '../promotional/${n}.png'\nduration ${t}`).join('\n')+"\nfile '../promotional/end-card.png'\n");
 for (const [index,shot,title,sub] of [[1,'paste-script','Paste your script.','Bring the words you already have.'],[2,'formatted-script','Keep writing.','Editable scenes, characters and dialogue.'],[3,'pdf-import','Open a new chapter.','Import text-based PDFs. Export your next draft.']]) {
  await writeFile(`branding/promotional/portrait-${index}.html`,`<!doctype html><html><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0;background:#f7f2e8;color:#342f29;font-family:'Courier New';padding:95px 65px;width:1080px;height:1920px;display:flex;flex-direction:column;gap:55px}header{font-size:42px;font-weight:bold;letter-spacing:-2px;border-bottom:1px solid #cfc4b2;padding-bottom:35px}h1{font-size:108px;line-height:1.1;letter-spacing:-6px;margin:70px 0 10px;font-weight:normal}img{width:100%;border:1px solid #cfc4b2;box-shadow:0 20px 40px #342f2912}p{font-size:39px;line-height:1.5}footer{margin-top:auto;font-size:27px;line-height:1.6}</style><body><header>FreeScript / 0${index}</header><h1>${title}</h1><img src="../screenshots/${shot}.png"><p>${sub}</p><footer>Free screenwriting for Mac.<br>Your story. Your page.<br><small>Real app captures · Fictional sample</small></footer></body></html>`);
  await page.setViewportSize({width:1080,height:1920});
  await page.goto('file://'+resolve(`branding/promotional/portrait-${index}.html`));
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:`branding/promotional/portrait-${index}.png`,scale:'css'});
 }
 await writeFile('branding/video/social-list.txt', [1,2,3].map(n=>`file '../promotional/portrait-${n}.png'\nduration 5`).join('\n')+"\nfile '../promotional/portrait-3.png'\n");
 // The portrait promo uses a continuous gentle zoom; all artwork remains within the safe area.
}finally{await app.close();}

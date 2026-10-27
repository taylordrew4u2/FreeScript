import { _electron as electron } from '@playwright/test';
import {resolve} from 'node:path';
const app=await electron.launch({args:[resolve('branding/scripts/render-main.cjs')]});
try {
 const page=await app.firstWindow();
 for(const [name,width,height] of [['banner',1920,1080],['social-square',1080,1080],['social-story',1080,1920],['readme-hero',1600,740],['campaign-poster',1600,1000],['brand-overview',1600,1200],['end-card',1920,1080]]) {
  await app.evaluate(({BrowserWindow},{width,height})=>BrowserWindow.getAllWindows()[0].setContentSize(width,height),{width,height});
  await page.setViewportSize({width,height});
  await page.goto('file://'+resolve(`branding/promotional/${name}.html`));
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await page.screenshot({path:`branding/promotional/${name}.png`,scale:'css'});
  console.log(`Rendered ${name} ${width}×${height}`);
 }
 for(const name of ['freescript-mark','freescript-wordmark','freescript-wordmark-reverse']) {
  const width=name==='freescript-mark'?1024:1500,height=name==='freescript-mark'?1024:300;
  await app.evaluate(({BrowserWindow},{width,height})=>BrowserWindow.getAllWindows()[0].setContentSize(width,height),{width,height});
  await page.setViewportSize({width,height});
  await page.goto('file://'+resolve(`branding/logos/${name}.svg`));
  await page.screenshot({path:`branding/logos/${name}.png`,omitBackground:true,scale:'css'});
 }
} finally {await app.close();}

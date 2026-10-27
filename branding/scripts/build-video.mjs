import {spawnSync} from 'node:child_process';
const ffmpeg=process.env.FREESCRIPT_FFMPEG||'ffmpeg';
function run(args){const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)throw new Error('Video encoding failed');}
for(const [list,name,duration] of [['workflow','workflow-demo',31],['social','social-promo',15]])run(['-f','concat','-safe','0','-i',`branding/video/${list}-list.txt`,'-t',String(duration),'-vf','fps=24,format=yuv420p','-c:v','libx264','-preset','fast','-crf','23','-movflags','+faststart','-an',`branding/video/${name}.mp4`]);
run(['-i','branding/video/workflow-demo.mp4','-filter_complex','fps=2,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer','-loop','0','branding/promotional/workflow-preview.gif']);
console.log('Encoded 31-second landscape demo, 15-second portrait promo and animated README preview.');

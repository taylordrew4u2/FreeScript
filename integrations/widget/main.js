import { App } from '@modelcontextprotocol/ext-apps';
const $ = selector => document.querySelector(selector);
let current;
function render(result) {
  const data = result?.structuredContent;
  if (!data?.document?.blocks) return;
  current = data;
  const paper = $('#paper'); paper.replaceChildren(); $('#outline').replaceChildren();
  const title = document.createElement('h1'); title.textContent = data.document.title; paper.append(title);
  const author = document.createElement('p'); author.className = 'author'; author.textContent = data.document.author ? `Written by ${data.document.author}` : 'A screenplay'; paper.append(author);
  let scene = 0;
  data.document.blocks.forEach(b => {
    const el = document.createElement('div');
    el.className = `block ${['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'].includes(b.type) ? b.type : 'action'}`;
    el.textContent = b.text;
    if (b.type === 'scene') {
      scene++; el.id = `scene-${scene}`;
      const link = document.createElement('a'); link.href = `#scene-${scene}`; link.textContent = `${scene}. ${b.text}`;
      link.onclick = event => { event.preventDefault(); el.scrollIntoView({ block: 'start', behavior: 'smooth' }); };
      $('#outline').append(link);
    }
    paper.append(el);
  });
  const pages = data.analysis?.estimatedPages;
  $('#stats').textContent = `${data.analysis?.words ?? '—'} words · ${scene} ${scene === 1 ? 'scene' : 'scenes'} · ~${pages ?? '—'} ${pages === 1 ? 'page' : 'pages'} (estimate) · Not saved on server`;
}
async function copy(kind) {
  if (!current) { $('#status').textContent = 'Prepare a screenplay first.'; return; }
  const text = kind === 'fountain' ? current.fountain : JSON.stringify(current.document, null, 2);
  try { await navigator.clipboard.writeText(text); $('#status').textContent = kind === 'fountain' ? 'Fountain copied. Save it as a .fountain file.' : 'JSON copied. Save it as a .json file, then import it in FreeScript.'; }
  catch { $('#fallback').hidden = false; $('#copy-text').value = text; $('#copy-text').focus(); $('#copy-text').select(); $('#status').textContent = 'Clipboard access is unavailable. Copy the text below.'; }
}
$('#outline-button').onclick = () => { $('#outline').hidden = !$('#outline').hidden; };
$('#fountain-button').onclick = () => copy('fountain');
$('#json-button').onclick = () => copy('json');
const app = new App({ name: 'FreeScript', version: '0.1.0' });
app.ontoolresult = render;
app.connect().catch(() => { $('#status').textContent = 'Open this preview from a FreeScript tool in a supported chat app.'; });

import './style.css';
import { TYPES, LABELS, block, createDocument, nextType, wordCount, estimatePages, toFountain, fromFountain, validateDocument } from './document.js';
import { icon } from './icons.js';

const STORAGE_KEY = 'freescript.library.v1';
let docs, activeId, currentBlock, saveTimer, search = '';
let storageAvailable = true;
const histories = new Map();
let restoringHistory = false;
try {
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
  if (stored && Array.isArray(stored.docs) && stored.docs.length && stored.docs.every(validateDocument)) {
    docs = stored.docs; activeId = docs.some(d => d.id === stored.activeId) ? stored.activeId : docs[0].id;
  }
} catch { /* A damaged library never prevents opening the app. */ }
if (!docs) { docs = [createDocument('The way back', true)]; activeId = docs[0].id; }
const doc = () => docs.find(d => d.id === activeId);
const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const btn = (id, label, symbol, cls = '') => `<button id="${id}" class="${cls}" title="${label}" aria-label="${label}">${icon(symbol)}</button>`;

document.querySelector('#app').innerHTML = `
  <aside class="sidebar" aria-label="Screenplay navigation">
    <a class="brand" href="#" aria-label="FreeScript home"><span class="brand-icon">${icon('typewriter', 25)}</span>FreeScript</a>
    <div class="workspace-label">YOUR MANUSCRIPTS</div>
    <button class="project-switch" id="library-toggle" aria-expanded="false"><span class="project-symbol">${icon('file', 20)}</span><span><strong id="project-title"></strong><small>Screenplay</small></span>${icon('down', 16)}</button>
    <div id="library" class="library" hidden></div>
    <button class="new-script" id="new-script">${icon('plus', 17)} New screenplay</button>
    <button class="new-script" id="paste-script">Paste a script</button><button class="new-script" id="import-script">Import PDF or screenplay</button><div class="sidebar-divider"></div>
    <div class="scene-heading"><span>SCENES <b id="scene-count">0</b></span>${btn('add-scene', 'Add scene', 'plus', 'icon-button')}</div>
    <label class="search-box">${icon('scenes', 16)}<input id="scene-search" type="search" placeholder="Find a scene…" aria-label="Find a scene" /><kbd>⌕</kbd></label>
    <nav id="scene-list" aria-label="Scenes"></nav>
    <div class="sidebar-bottom"><div class="private-note"><span class="status-dot"></span><span>Just you and your story.<small>Saved on this Mac. Always yours.</small></span></div><button id="help" class="help-button">${icon('help', 18)} A little help <span>⌘ /</span></button></div>
  </aside>
  <main class="main">
    <header class="topbar"><div class="breadcrumb">${btn('mobile-menu', 'Toggle sidebar', 'menu', 'icon-button')}<span>My workspace</span>${icon('chevron', 13)}<button id="rename" class="title-button"></button><span class="draft-badge">DRAFT</span></div><div class="top-actions"><span id="save-status" role="status">${icon('check', 14)} All changes saved</span><button id="export" class="export-button">${icon('download', 16)} Export ${icon('down', 13)}</button></div></header>
    <section class="writing-top"><div><div class="eyebrow">FREESCRIPT / THE WRITING ROOM</div><h1>FADE IN.</h1><p>A page. A few words. A story.</p></div><span class="writing-tag">${icon('typewriter', 22)} OFFLINE. ON THE PAGE.</span></section>
    <section class="editor-shell" aria-label="Screenplay workspace"><div class="toolbar"><div class="format-group"><span class="toolbar-label">FORMAT</span><select id="block-type" aria-label="Element type">${TYPES.map(t => `<option value="${t}">${LABELS[t]}</option>`).join('')}</select><kbd>Tab</kbd></div><div class="toolbar-right"><span class="paper-size">US Letter</span><span class="toolbar-separator"></span>${btn('title-page', 'Edit title page', 'file', 'icon-button')}${btn('focus', 'Toggle focus mode', 'focus', 'icon-button')}<button id="zoom" title="Change zoom" class="zoom-button">100% ${icon('down', 12)}</button></div></div>
      <div class="paper-scroll" id="paper-scroll"><div class="paper" id="paper"><div class="paper-running"><span id="paper-title"></span><span>1.</span></div><div id="editor" role="group" aria-label="Screenplay editor"></div><div class="paper-end"><span></span> YOUR NEXT SCENE IS WAITING <span></span></div></div></div>
      <footer class="editor-footer"><span><span class="status-dot"></span><span id="draft-status">First draft</span></span><div><span id="word-count"></span><span class="footer-dot">·</span><span id="page-count"></span><span class="footer-dot">·</span><span id="runtime"></span></div><span class="keyboard-hint"><kbd>Enter</kbd> next element <kbd>Tab</kbd> change format</span></footer>
    </section>
    <div class="under-editor"><span>US LETTER / COURIER</span><span>NO ACCOUNT. JUST WRITE.</span></div>
  </main>
  <button id="exit-focus" hidden>${icon('focus', 16)} Exit focus</button>
  <dialog id="modal"><div id="modal-content"></div></dialog><div id="toast" role="status"></div><input type="file" id="file-input" accept=".pdf,.fountain,.txt,.json" hidden />
`;
const $ = selector => document.querySelector(selector);
const editor = $('#editor');

function persist() {
  clearTimeout(saveTimer);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ docs, activeId }));
    storageAvailable = true;
    $('#save-status').innerHTML = `${icon('check', 14)} All changes saved`;
  } catch {
    storageAvailable = false;
    $('#save-status').textContent = 'Save failed — export a backup';
    toast('Local storage is full or unavailable. Export a backup to keep your work.');
  }
}
function changed() {
  doc().updatedAt = Date.now();
  if (!restoringHistory) {
    const h = histories.get(activeId);
    const snapshot = JSON.stringify(doc());
    if (h && h.entries[h.index] !== snapshot) {
      h.entries.splice(h.index + 1);
      if (Date.now() - h.lastEdit < 650 && h.index > 0) h.entries[h.index] = snapshot;
      else { h.entries.push(snapshot); h.index++; }
      if (h.entries.length > 100) { h.entries.shift(); h.index--; }
      h.lastEdit = Date.now();
    }
  }
  $('#save-status').textContent = 'Saving…';
  saveTimer = setTimeout(persist, 350);
  updateStats(); renderScenes();
}
function renderDocument() {
  if (!histories.has(activeId)) histories.set(activeId, { entries: [JSON.stringify(doc())], index: 0, lastEdit: 0 });
  currentBlock = doc().blocks[0].id;
  editor.replaceChildren();
  doc().blocks.forEach(b => editor.append(makeBlock(b)));
  $('#project-title').textContent = doc().title;
  $('#rename').textContent = doc().title;
  $('#paper-title').textContent = doc().title;
  document.title = `${doc().title} — FreeScript`;
  $('#block-type').value = doc().blocks[0].type;
  updateStats(); renderScenes(); renderLibrary();
  $('#paper-scroll').scrollTop = 0;
}
function makeBlock(b) {
  const el = document.createElement('div');
  el.className = `script-block ${b.type}`;
  el.dataset.id = b.id;
  el.contentEditable = 'plaintext-only';
  el.spellcheck = true;
  el.setAttribute('role', 'textbox');
  el.setAttribute('aria-label', LABELS[b.type]);
  el.setAttribute('aria-multiline', 'true');
  el.dataset.placeholder = LABELS[b.type];
  el.textContent = b.text;
  return el;
}
function updateStats() {
  const words = wordCount(doc()); const pages = estimatePages(doc());
  $('#word-count').textContent = `${words.toLocaleString()} words`;
  $('#page-count').textContent = `~${pages} ${pages === 1 ? 'page' : 'pages'}`;
  $('#runtime').textContent = `~${pages} min read`;
}
function renderScenes() {
  const scenes = doc().blocks.filter(b => b.type === 'scene');
  $('#scene-count').textContent = scenes.length;
  let currentScene;
  for (const b of doc().blocks) { if (b.type === 'scene') currentScene = b.id; if (b.id === currentBlock) break; }
  $('#scene-list').innerHTML = scenes.map((b, i) => ({ b, i })).filter(({ b }) => b.text.toLowerCase().includes(search)).map(({ b, i }) => `<button class="scene-item ${b.id === currentScene ? 'active' : ''}" data-scene="${b.id}" ${b.id === currentScene ? 'aria-current="true"' : ''}><span class="scene-number">${String(i + 1).padStart(2, '0')}</span><span class="scene-detail"><strong>${escape(b.text || 'Untitled scene')}</strong><small>${escape(sceneSummary(b.id))}</small></span><span class="scene-indicator"></span></button>`).join('') || '<p class="empty-scenes">No scenes found. Add a scene heading to get started.</p>';
}
function sceneSummary(id) {
  const index = doc().blocks.findIndex(b => b.id === id);
  const next = doc().blocks.slice(index + 1).find(b => b.text.trim());
  return next?.type === 'action' ? next.text.slice(0, 52) : 'A new scene awaits';
}
function renderLibrary() {
  $('#library').innerHTML = docs.map(d => `<div class="library-row"><button class="library-doc ${d.id === activeId ? 'selected' : ''}" data-doc="${d.id}">${icon('file', 15)}<span>${escape(d.title)}</span></button><button class="delete-doc icon-button" data-delete="${d.id}" aria-label="Delete ${escape(d.title)}">${icon('trash', 14)}</button></div>`).join('') + '<button class="import-library" id="import-library">' + icon('upload', 15) + ' Import screenplay</button>';
}
function focusBlock(id, end = true) {
  const el = editor.querySelector(`[data-id="${id}"]`);
  if (!el) return;
  el.focus();
  const range = document.createRange(); range.selectNodeContents(el); range.collapse(!end);
  const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
}
function setType(type) {
  const b = doc().blocks.find(b => b.id === currentBlock);
  if (!b) return;
  b.type = type;
  const el = editor.querySelector(`[data-id="${b.id}"]`);
  el.className = `script-block ${type}`; el.dataset.placeholder = LABELS[type]; el.setAttribute('aria-label', LABELS[type]);
  $('#block-type').value = type;
  changed();
}
editor.addEventListener('focusin', event => {
  const el = event.target.closest('.script-block');
  if (!el) return;
  currentBlock = el.dataset.id;
  $('#block-type').value = doc().blocks.find(b => b.id === currentBlock).type;
  renderScenes();
});
editor.addEventListener('input', event => {
  const el = event.target.closest('.script-block');
  if (!el) return;
  const b = doc().blocks.find(b => b.id === el.dataset.id);
  b.text = el.innerText.replace(/\r/g, '').replace(/\n$/, '');
  changed();
});
editor.addEventListener('beforeinput', event => {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  const el = event.target.closest('.script-block');
  if (el && (!el.contains(range.startContainer) || !el.contains(range.endContainer))) {
    event.preventDefault(); toast('Edit one screenplay element at a time.');
  }
});
editor.addEventListener('keydown', event => {
  if (event.isComposing) return;
  const el = event.target.closest('.script-block');
  if (!el) return;
  const index = doc().blocks.findIndex(b => b.id === el.dataset.id);
  const b = doc().blocks[index];
  if (event.key === 'Tab') {
    event.preventDefault(); setType(TYPES[(TYPES.indexOf(b.type) + (event.shiftKey ? TYPES.length - 1 : 1)) % TYPES.length]);
  } else if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const tail = range.cloneRange(); tail.setEnd(el, el.childNodes.length);
    const trailing = tail.toString(); tail.deleteContents();
    b.text = el.textContent;
    const next = block(nextType(b.type), trailing);
    doc().blocks.splice(index + 1, 0, next);
    el.after(makeBlock(next)); focusBlock(next.id, false); changed();
  } else if (event.key === 'Backspace') {
    const selection = window.getSelection();
    if (!selection.isCollapsed || !selection.rangeCount) return;
    const before = selection.getRangeAt(0).cloneRange(); before.selectNodeContents(el); before.setEnd(selection.anchorNode, selection.anchorOffset);
    if (before.toString() === '' && index > 0) {
      event.preventDefault();
      const previous = doc().blocks[index - 1];
      const previousEl = el.previousElementSibling;
      focusBlock(previous.id);
      const caret = window.getSelection().getRangeAt(0);
      caret.insertNode(document.createTextNode(b.text));
      previous.text += b.text;
      doc().blocks.splice(index, 1); el.remove(); currentBlock = previous.id;
      $('#block-type').value = previous.type; changed();
      previousEl.focus();
    }
  }
});
// Keep selection inside one screenplay element so formatting remains predictable.
editor.addEventListener('paste', event => {
  const el = event.target.closest('.script-block');
  if (!el) return;
  event.preventDefault();
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  const range = selection.getRangeAt(0);
  if (!el.contains(range.startContainer) || !el.contains(range.endContainer)) { toast('Paste into one screenplay element at a time.'); return; }
  const source = event.clipboardData.getData('text/plain');
  if (/\n/.test(source.trim())) {
    const parsed = fromFountain(source);
    const before = range.cloneRange(); before.selectNodeContents(el); before.setEnd(range.startContainer, range.startOffset);
    const after = range.cloneRange(); after.selectNodeContents(el); after.setStart(range.endContainer, range.endOffset);
    const original = doc().blocks.find(b => b.id === el.dataset.id);
    const inserted = [...(before.toString() ? [block(original.type, before.toString())] : []), ...parsed.blocks, ...(after.toString() ? [block(original.type, after.toString())] : [])];
    histories.get(activeId).lastEdit = 0;
    doc().blocks.splice(doc().blocks.indexOf(original), 1, ...inserted);
    renderDocument(); focusBlock(parsed.blocks.at(-1).id); changed(); histories.get(activeId).lastEdit = 0;
    toast('Pasted script formatted. Keep writing, or use ⌘ Z to undo.'); return;
  }
  range.deleteContents();
  const node = document.createTextNode(source);
  range.insertNode(node); range.setStartAfter(node); range.collapse(true); selection.removeAllRanges(); selection.addRange(range);
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
$('#block-type').addEventListener('change', event => { setType(event.target.value); focusBlock(currentBlock); });
$('#scene-list').addEventListener('click', event => {
  const target = event.target.closest('[data-scene]');
  if (target) { focusBlock(target.dataset.scene, false); editor.querySelector(`[data-id="${target.dataset.scene}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' }); document.body.classList.remove('show-sidebar'); }
});
$('#scene-search').addEventListener('input', event => { search = event.target.value.toLowerCase(); renderScenes(); });
$('#add-scene').onclick = () => {
  const b = block('scene'); doc().blocks.push(b, block()); editor.append(makeBlock(b), makeBlock(doc().blocks.at(-1)));
  focusBlock(b.id); editor.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'center' }); changed();
};
$('#library-toggle').onclick = () => { $('#library').hidden = !$('#library').hidden; $('#library-toggle').setAttribute('aria-expanded', !$('#library').hidden); renderLibrary(); };
$('#library').onclick = event => {
  const target = event.target.closest('[data-doc]');
  const remove = event.target.closest('[data-delete]');
  if (target) { persist(); activeId = target.dataset.doc; search = ''; $('#scene-search').value = ''; renderDocument(); persist(); $('#library').hidden = true; $('#library-toggle').setAttribute('aria-expanded', 'false'); }
  if (event.target.closest('#import-library')) $('#file-input').click();
  if (remove) {
    const doomed = docs.find(d => d.id === remove.dataset.delete);
    openModal(`<h2>Delete screenplay?</h2><p>“${escape(doomed.title)}” will be removed from this Mac. Export a backup first if you want to keep it.</p><div class="modal-actions"><button data-close>Keep screenplay</button><button id="confirm-delete" class="danger">Delete screenplay</button></div>`);
    $('#confirm-delete').onclick = () => { docs = docs.filter(d => d.id !== doomed.id); if (!docs.length) docs = [createDocument()]; if (activeId === doomed.id) activeId = docs[0].id; renderDocument(); persist(); closeModal(); toast('Screenplay deleted.'); };
  }
};
function newScript() {
  openModal(`<div class="modal-eyebrow">A FRESH PAGE</div><h2>Every story starts somewhere.</h2><p>Give yours a working title. You can change it anytime.</p><form id="new-form"><label>Screenplay title<input name="title" placeholder="Untitled screenplay" maxlength="120" autofocus /></label><label>Written by<input name="author" placeholder="Your name" maxlength="120" /></label><div class="modal-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Start writing ${icon('arrow', 16)}</button></div></form>`);
  $('#new-form').onsubmit = event => { event.preventDefault(); persist(); const data = new FormData(event.target); const next = createDocument(data.get('title').trim() || 'Untitled screenplay'); next.author = data.get('author').trim(); docs.push(next); activeId = next.id; search = ''; $('#scene-search').value = ''; renderDocument(); persist(); closeModal(); focusBlock(next.blocks[0].id); };
}
$('#new-script').onclick = newScript;
$('#import-script').onclick = () => $('#file-input').click();
$('#paste-script').onclick = () => {
  openModal(`<h2>Paste your script.</h2><p>Paste your complete script below, then open it as an editable screenplay. Your existing scripts stay in your library.</p><form id="paste-form"><label>Title<input name="title" placeholder="Imported screenplay" /></label><label>Script text<textarea id="paste-text" rows="12" placeholder="INT. COFFEE SHOP - DAY…" required autofocus></textarea></label><p id="paste-summary" role="status">Scene headings, characters and dialogue are formatted automatically.</p><div class="modal-actions"><button type="button" data-close>Cancel</button><button class="primary">Open screenplay</button></div></form>`);
  $('#paste-text').oninput = () => { const parsed = fromFountain($('#paste-text').value); $('#paste-summary').textContent = `${parsed.blocks.filter(b => b.type === 'scene').length} scenes · ${wordCount(parsed)} words · Ready to edit`; };
  $('#paste-form').onsubmit = event => { event.preventDefault(); const imported = fromFountain($('#paste-text').value, new FormData(event.target).get('title').trim() || 'Imported screenplay'); addImported(imported); };
};
function addImported(imported) {
  imported.id = crypto.randomUUID(); imported.blocks.forEach(b => { b.id = crypto.randomUUID(); });
  imported.updatedAt = Date.now();
  persist(); docs.push(imported); activeId = imported.id; search = ''; $('#scene-search').value = ''; renderDocument(); persist(); closeModal(); focusBlock(imported.blocks.at(-1).id); toast('Screenplay imported. Ready to keep writing.');
}
function titlePage() {
  openModal(`<div class="modal-eyebrow">THE TITLE PAGE</div><h2>Make it yours.</h2><p>These details appear on your exported title page.</p><form id="title-form"><label>Screenplay title<input name="title" value="${escape(doc().title)}" maxlength="120" required autofocus /></label><label>Written by<input name="author" value="${escape(doc().author)}" placeholder="Your name" maxlength="120" /></label><div class="modal-actions"><button type="button" data-close>Cancel</button><button class="primary" type="submit">Save details</button></div></form>`);
  $('#title-form').onsubmit = event => { event.preventDefault(); const data = new FormData(event.target); doc().title = data.get('title').trim() || 'Untitled screenplay'; doc().author = data.get('author').trim(); doc().updatedAt = Date.now(); renderDocument(); persist(); closeModal(); };
}
$('#rename').onclick = titlePage; $('#title-page').onclick = titlePage;
function exportDialog() {
  openModal(`<div class="modal-eyebrow">READY FOR THE NEXT STEP</div><h2>Let your story travel.</h2><p>Export a copy. Your original stays right here.</p><div class="export-options"><button id="export-pdf">${icon('file', 24)}<span><strong>PDF document</strong><small>Formatted screenplay with a title page</small></span>${icon('arrow', 18)}</button><button id="export-fountain">${icon('download', 24)}<span><strong>Fountain screenplay</strong><small>Editable in other screenwriting apps</small></span>${icon('arrow', 18)}</button><button id="export-json">${icon('download', 24)}<span><strong>FreeScript backup</strong><small>Save a complete, editable copy</small></span>${icon('arrow', 18)}</button></div><div class="modal-actions"><button id="import-from-export">${icon('upload', 16)} Import a screenplay</button><button data-close>Done</button></div>`);
  $('#export-fountain').onclick = () => download(toFountain(doc()), 'fountain', 'text/plain');
  $('#export-json').onclick = () => download(JSON.stringify(doc(), null, 2), 'json', 'application/json');
  $('#export-pdf').onclick = printScript;
  $('#import-from-export').onclick = () => $('#file-input').click();
}
$('#export').onclick = exportDialog;
function download(content, extension, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = `${doc().title.replace(/[^a-z0-9 _-]/gi, '').trim() || 'screenplay'}.${extension}`;
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function printScript() {
  closeModal();
  document.querySelector('#print-title')?.remove();
  const page = document.createElement('section'); page.id = 'print-title';
  page.innerHTML = `<div><h1>${escape(doc().title)}</h1><p>Written by</p><p>${escape(doc().author || 'Anonymous')}</p></div>`;
  document.body.append(page);
  if (window.freeScript) {
    try { const result = await window.freeScript.exportPDF(doc().title); if (result) toast('PDF saved. Your story is ready to share.'); }
    catch { toast('PDF export failed. Please try again.'); }
  } else window.print();
}
$('#file-input').onchange = async event => {
  const file = event.target.files[0]; if (!file) return;
  if (file.size > 10 * 1024 * 1024) { toast('Please choose a screenplay smaller than 10 MB.'); event.target.value = ''; return; }
  try {
    toast('Opening screenplay…');
    const isPDF = /\.pdf$/i.test(file.name);
    const source = isPDF ? await (await import('./pdf-import.js')).extractPDF(await file.arrayBuffer()) : await file.text();
    const imported = /\.json$/i.test(file.name) ? JSON.parse(source) : fromFountain(source, file.name);
    if (!validateDocument(imported)) throw new Error('Invalid backup');
    addImported(imported);
  } catch (error) { toast(error?.message?.startsWith('PDF:') ? error.message : 'Could not open this file. Choose an unlocked PDF, Fountain, text, or FreeScript JSON file.'); }
  event.target.value = '';
};
function focusMode() {
  const focused = document.body.classList.toggle('focus-mode');
  $('#exit-focus').hidden = !focused;
  $('#focus').setAttribute('aria-pressed', focused);
}
$('#focus').onclick = focusMode; $('#exit-focus').onclick = focusMode;
$('#mobile-menu').onclick = () => document.body.classList.toggle('show-sidebar');
let zoom = 100;
$('#zoom').onclick = () => { zoom = zoom === 100 ? 115 : zoom === 115 ? 85 : 100; $('#zoom').innerHTML = `${zoom}% ${icon('down', 12)}`; $('#paper').style.zoom = zoom / 100; };
function help() {
  openModal(`<div class="modal-eyebrow">A LITTLE HELP</div><h2>Stay in the story.</h2><p>FreeScript handles the formatting. You bring the words.</p><div class="shortcuts"><span>Next screenplay element</span><kbd>Enter</kbd><span>Change element type</span><kbd>Tab / Shift Tab</kbd><span>New line within an element</span><kbd>Shift Enter</kbd><span>New screenplay</span><kbd>⌘ N</kbd><span>Import screenplay</span><kbd>⌘ O</kbd><span>Export / save a backup</span><kbd>⌘ S</kbd><span>Export PDF</span><kbd>⌘ P</kbd><span>Focus mode</span><kbd>⌘ Shift F</kbd></div><div class="help-note"><strong>Your words belong to you.</strong><p>Scripts autosave on this Mac. Export backups regularly to keep an extra copy. FreeScript works offline, with no account or subscription.</p><p>Page counts are estimates. PDF export creates the final pagination. Paste a script or import a text-based PDF to keep editing. Scanned PDFs need text recognition first. Automatic formatting may need adjustments. Fountain import supports common screenplay elements; advanced Fountain markup is preserved as plain text or skipped for notes and sections.</p></div><div class="modal-actions"><button class="primary" data-close>Back to writing</button></div>`);
}
$('#help').onclick = help;
let lastFocus;
function openModal(html) {
  lastFocus = document.activeElement;
  $('#modal-content').innerHTML = `<button class="modal-close icon-button" data-close aria-label="Close dialog">${icon('close', 20)}</button>` + html;
  if (!$('#modal').open) $('#modal').showModal();
  $('#modal').setAttribute('aria-label', $('#modal h2')?.textContent || 'Screenplay options');
  $('#modal').querySelector('[autofocus]')?.focus();
  $('#modal-content').querySelectorAll('[data-close]').forEach(button => { button.onclick = closeModal; });
}
function closeModal() { $('#modal').close(); lastFocus?.focus(); }
$('#modal').addEventListener('click', event => { if (event.target === $('#modal')) { const r = $('#modal').getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeModal(); } });
let toastTimer;
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 5500); }
function menuAction(action) {
  if (action === 'undo' || action === 'redo') {
    if ($('#modal').open || !editor.contains(document.activeElement)) { document.execCommand(action); return; }
    const h = histories.get(activeId);
    const next = h.index + (action === 'undo' ? -1 : 1);
    if (next < 0 || next >= h.entries.length) return;
    const focused = currentBlock;
    h.index = next; h.lastEdit = 0;
    docs[docs.findIndex(d => d.id === activeId)] = JSON.parse(h.entries[next]);
    restoringHistory = true; renderDocument(); focusBlock(doc().blocks.some(b => b.id === focused) ? focused : doc().blocks.at(-1).id); changed(); restoringHistory = false;
  }
  if (action === 'new') newScript();
  if (action === 'open') $('#file-input').click();
  if (action === 'save') { persist(); exportDialog(); }
  if (action === 'pdf') printScript();
  if (action === 'focus') focusMode();
  if (action === 'help') help();
}
window.freeScript?.onMenuAction(menuAction);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && document.body.classList.contains('focus-mode') && !$('#modal').open) focusMode();
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key === 'a' && editor.contains(document.activeElement)) {
    event.preventDefault(); const range = document.createRange(); range.selectNodeContents(document.activeElement); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); return;
  }
  if (key === 'z' && editor.contains(document.activeElement)) { event.preventDefault(); menuAction(event.shiftKey ? 'redo' : 'undo'); return; }
  const action = ({ n: 'new', o: 'open', s: 'save', p: 'pdf', '/': 'help' })[key] || (key === 'f' && event.shiftKey ? 'focus' : null);
  if (action) { event.preventDefault(); if (!event.repeat) menuAction(action); }
});
window.addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
renderDocument(); persist();
if (!window.freeScript) $('.private-note small').textContent = 'Saved in this browser. Always yours.';

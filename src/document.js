export const TYPES = ['scene', 'action', 'character', 'dialogue', 'parenthetical', 'transition'];
export const LABELS = { scene: 'Scene heading', action: 'Action', character: 'Character', dialogue: 'Dialogue', parenthetical: 'Parenthetical', transition: 'Transition' };
export const uid = () => crypto.randomUUID();
export const block = (type = 'action', text = '') => ({ id: uid(), type, text });
export function createDocument(title = 'Untitled screenplay', sample = false) {
  return { id: uid(), title, author: '', updatedAt: Date.now(), blocks: sample ? [
    block('transition', 'FADE IN:'),
    block('scene', 'EXT. COASTAL ROAD - DAWN'),
    block('action', 'The world is still blue. A ribbon of road follows the edge of the ocean, disappearing into the morning fog.'),
    block('action', 'A weathered station wagon rounds the bend. One headlight. A surfboard strapped to the roof.'),
    block('scene', 'INT. STATION WAGON - CONTINUOUS'),
    block('action', 'ELLA, 28, drives with the windows down. A folded map rides shotgun. Her phone lights up. She lets it ring.'),
    block('character', 'ELLA'),
    block('parenthetical', '(to herself)'),
    block('dialogue', 'Just a little further.'),
    block('action', 'She turns up the radio. An old song fights through the static.'),
    block('scene', 'EXT. BEACH PARKING LOT - MORNING'),
    block('action', 'The wagon rolls to a stop. Beyond the windshield: an empty beach, an endless horizon. Ella takes a breath.'),
    block('action', 'For the first time in a long time, there is nowhere else she needs to be.')
  ] : [block('scene', 'INT. SOMEWHERE - DAY'), block('action')] };
}
export function nextType(type) {
  return ({ scene: 'action', character: 'dialogue', parenthetical: 'dialogue', dialogue: 'action', transition: 'scene', action: 'action' })[type] || 'action';
}
export function wordCount(doc) {
  return doc.blocks.map(b => b.text).join(' ').trim().split(/\s+/u).filter(Boolean).length;
}
export function estimatePages(doc) {
  // Screenplay pages are approximately 55 lines, with narrower dialogue columns.
  const lines = doc.blocks.reduce((n, b) => n + Math.max(1, b.text.split('\n').reduce((s, line) => s + Math.max(1, Math.ceil(line.length / (['dialogue', 'parenthetical'].includes(b.type) ? 35 : 60))), 0)) + 1, 0);
  return Math.max(1, Math.ceil(lines / 55));
}
export function toFountain(doc) {
  const prefix = { scene: '.', character: '@', transition: '>', action: '!', dialogue: '', parenthetical: '' };
  const title = doc.title.replace(/[\r\n]/g, ' ');
  const author = doc.author.replace(/[\r\n]/g, ' ');
  let output = `Title: ${title}\nCredit: Written by\nAuthor: ${author}\n\n`;
  doc.blocks.forEach((b, i) => {
    const value = ['scene', 'character', 'transition'].includes(b.type) ? b.text.toUpperCase() : b.text;
    const previous = doc.blocks[i - 1];
    const connected = ['dialogue', 'parenthetical'].includes(b.type) && previous && ['character', 'dialogue', 'parenthetical'].includes(previous.type);
    output += (i === 0 ? '' : connected ? '\n' : '\n\n') + prefix[b.type] + value;
  });
  return output + '\n';
}
export function fromFountain(source, filename = 'Imported screenplay') {
  const doc = createDocument(filename.replace(/\.[^.]+$/, ''));
  doc.blocks = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;
  if (/^(title|author|credit|draft date|contact|copyright|source):/i.test(lines[0] || '')) {
    while (index < lines.length && lines[index].trim()) {
      const match = lines[index].match(/^(title|author):\s*(.*)/i);
      if (match) doc[match[1].toLowerCase()] = match[2];
      index++;
    }
  }
  let inDialogue = false;
  let separated = true;
  for (; index < lines.length; index++) {
    const text = lines[index].trim();
    if (!text) { inDialogue = false; separated = true; continue; }
    // Ignore Fountain section, synopsis, note-only and page-break lines.
    if (/^(#|=|\[\[)/.test(text)) continue;
    let type = 'action';
    let value = text;
    if (/^\.(?!\.)/.test(text) || /^(INT\.?|EXT\.?|INT\.?\/EXT\.?|I\/E\.?|EST\.?)\s/i.test(text)) {
      type = 'scene'; value = text.replace(/^\./, ''); inDialogue = false;
    } else if (text.startsWith('!')) { value = text.slice(1); inDialogue = false; }
    else if (text.startsWith('>') || /TO:$/.test(text) || /^(?:FADE IN:|FADE OUT[.:]?|FADE TO BLACK[.:]?)$/i.test(text)) { type = 'transition'; value = text.replace(/^>\s*/, ''); inDialogue = false; }
    else if (text.startsWith('@') || (/^[A-Z][A-Z0-9 ._'’()\-]{0,39}$/.test(text) && !/[.!?:]$/.test(text) && lines[index + 1]?.trim() && !/^(?:INT\.?|EXT\.?)\s/i.test(lines[index + 1].trim()) && (separated || inDialogue || /^\s{2,}/.test(lines[index])))) {
      type = 'character'; value = text.replace(/^@/, ''); inDialogue = true;
    } else if (inDialogue) { type = /^\(.*\)$/.test(text) ? 'parenthetical' : 'dialogue'; }
    const previous = doc.blocks.at(-1);
    if (!separated && previous?.type === type && ['action', 'dialogue'].includes(type)) previous.text += '\n' + value;
    else doc.blocks.push(block(type, value));
    separated = false;
  }
  if (!doc.blocks.length) doc.blocks = [block()];
  return doc;
}
export function validateDocument(doc) {
  return doc && typeof doc.id === 'string' && typeof doc.title === 'string' && typeof doc.author === 'string' && Array.isArray(doc.blocks) && doc.blocks.length > 0 && doc.blocks.every(b => typeof b.id === 'string' && TYPES.includes(b.type) && typeof b.text === 'string');
}

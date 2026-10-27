import { test } from 'node:test';
import assert from 'node:assert/strict';
import { block, createDocument, fromFountain, toFountain, validateDocument, nextType, wordCount, estimatePages } from '../src/document.js';

test('Fountain export and import preserve all supported element types and dialogue grouping', () => {
  const original = createDocument('A small story');
  original.author = 'A Writer';
  original.blocks = [block('scene', 'INT. KITCHEN - DAY'), block('action', 'A kettle whistles.\nThe room is empty.'), block('character', 'JUNE'), block('parenthetical', '(quietly)'), block('dialogue', 'Hello?\nIs anyone here?'), block('transition', 'CUT TO:')];
  const imported = fromFountain(toFountain(original));
  assert.equal(imported.title, original.title);
  assert.equal(imported.author, original.author);
  assert.deepEqual(imported.blocks.map(({ type, text }) => ({ type, text })), original.blocks.map(({ type, text }) => ({ type, text })));
});
test('Unforced Fountain character cues, scene headings and transitions import correctly', () => {
  const result = fromFountain('INT. HOUSE - NIGHT\n\nRain on the roof.\n\nJUNE\n(whispering)\nStay here.\n\nCUT TO:\n\nEXT. HOUSE - DAWN');
  assert.deepEqual(result.blocks.map(b => b.type), ['scene', 'action', 'character', 'parenthetical', 'dialogue', 'transition', 'scene']);
});
test('Empty import creates an editable block; invalid backups are rejected', () => {
  assert.equal(fromFountain('').blocks.length, 1);
  assert.equal(validateDocument(createDocument()), true);
  assert.equal(validateDocument({ ...createDocument(), blocks: [] }), false);
  assert.equal(validateDocument({ ...createDocument(), blocks: [{ id: 'x', type: '<script>', text: '' }] }), false);
});
test('Formatting flow follows screenplay conventions', () => {
  assert.equal(nextType('scene'), 'action');
  assert.equal(nextType('character'), 'dialogue');
  assert.equal(nextType('parenthetical'), 'dialogue');
  assert.equal(nextType('dialogue'), 'action');
});
test('Word counts ignore empty elements and page estimates grow with text', () => {
  const result = createDocument(); result.blocks = [block('action', '  One two\nthree  '), block()];
  assert.equal(wordCount(result), 3);
  assert.equal(estimatePages(result), 1);
  result.blocks.push(block('dialogue', 'word '.repeat(2000)));
  assert.ok(estimatePages(result) > 3);
});

test('formats pasted indented dialogue and transitions without blank separators', () => {
  const imported = fromFountain('FADE IN:\nINT. ROOM - NIGHT\nA light flickers.\n    JUNE\n  (quietly)\n  Is anyone here?\n    MAX\n  Only me.\nFADE OUT.');
  assert.deepEqual(imported.blocks.map(b => b.type), ['transition', 'scene', 'action', 'character', 'parenthetical', 'dialogue', 'character', 'dialogue', 'transition']);
  assert.equal(imported.blocks[5].text, 'Is anyone here?');
});

test('uppercase pasted scripts distinguish action, wrapped dialogue and indented cues', () => {
  const imported = fromFountain('INT. VAN - DAY\n\nA LONG BEAT.\nSHE LOOKS OUTSIDE.\n\n                      NANCY\n          REMEMBER WHEN WE WERE NEW AND WE\n          JUST DID RAILINGS?\n\n                      DAN\n          YEP.');
  assert.deepEqual(imported.blocks.map(b => b.type), ['scene', 'action', 'character', 'dialogue', 'character', 'dialogue']);
  assert.equal(imported.blocks[3].text, 'REMEMBER WHEN WE WERE NEW AND WE\nJUST DID RAILINGS?');
});

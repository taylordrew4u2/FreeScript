import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerURL;

// Rebuild reading order from text coordinates rather than PDF drawing order.
export async function extractPDF(data) {
  const task = getDocument({ data: new Uint8Array(data), isEvalSupported: false, useSystemFonts: true });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      const rows = [];
      for (const item of content.items) {
        if (!item.str?.trim()) continue;
        const x = item.transform[4], y = item.transform[5];
        let row = rows.find(row => Math.abs(row.y - y) < 3);
        if (!row) { row = { y, items: [], height: Math.abs(item.height) || 12 }; rows.push(row); }
        row.items.push({ x, width: item.width, text: item.str });
      }
      rows.sort((a, b) => b.y - a.y);
      const lines = [];
      let previous;
      for (const row of rows) {
        row.items.sort((a, b) => a.x - b.x);
        let text = '', right = -Infinity;
        for (const item of row.items) {
          if (text && item.x - right > 2 && !text.endsWith(' ') && !item.text.startsWith(' ')) text += ' ';
          text += item.text; right = item.x + item.width;
        }
        text = text.trim();
        // Page numerals are layout, not screenplay content.
        if (/^\d+\.?$/.test(text) && (row.y > page.view[3] - 65 || row.y < 55)) continue;
        if (previous && previous.y - row.y > row.height * 1.7) lines.push('');
        // Preserve indentation to distinguish compact character cues.
        lines.push(' '.repeat(Math.max(0, Math.min(60, Math.round((row.items[0].x - 72) / 6)))) + text);
        previous = row;
      }
      pages.push(lines.join('\n')); page.cleanup();
    }
    const source = pages.join('\n\n');
    if (!source.trim()) throw new Error('PDF: No selectable text found. Scanned scripts need text recognition before import.');
    return source;
  } catch (error) {
    if (error.name === 'PasswordException') throw new Error('PDF: This script is password protected. Import an unlocked copy.');
    throw error;
  } finally { await task.destroy(); }
}

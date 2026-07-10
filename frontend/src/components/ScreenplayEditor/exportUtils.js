// Export utilities for Screenplay Editor

export function exportToFountain(content, title = 'Untitled') {
  const lines = [];
  
  // Title page
  lines.push(`Title: ${title}`);
  lines.push(`Author: `);
  lines.push(`Source: `);
  lines.push(`Draft: `);
  lines.push(`Date: ${new Date().toLocaleDateString()}`);
  lines.push(`Contact: `);
  lines.push(''); // blank line
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = doc.querySelectorAll('.screenplay-element');
  
  elements.forEach((el, index) => {
    const type = el.getAttribute('data-element-type');
    const text = el.textContent.trim();
    if (!text) return;
    
    switch (type) {
      case 'scene-heading':
        lines.push(text.toUpperCase());
        break;
      case 'action':
        lines.push(text);
        break;
      case 'character':
        lines.push(text.toUpperCase());
        break;
      case 'parenthetical':
        lines.push(`(${text.replace(/^\(|\)$/g, '')})`);
        break;
      case 'dialogue':
        lines.push(text);
        break;
      case 'transition':
        lines.push(`> ${text.toUpperCase()}`);
        break;
      case 'shot':
        lines.push(text.toUpperCase());
        break;
      default:
        lines.push(text);
    }
    
    // Add blank line between elements (except after transition)
    if (index < elements.length - 1 && type !== 'transition') {
      lines.push('');
    }
  });
  
  return lines.join('\n');
}

export function exportToPlainText(content, title = 'Untitled') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const elements = doc.querySelectorAll('.screenplay-element');
  
  const lines = [`${title.toUpperCase()}`, ''];
  
  elements.forEach((el) => {
    const type = el.getAttribute('data-element-type');
    const text = el.textContent.trim();
    if (!text) return;
    
    switch (type) {
      case 'scene-heading':
        lines.push(text.toUpperCase());
        break;
      case 'action':
        lines.push(text);
        break;
      case 'character':
        lines.push(text.toUpperCase());
        break;
      case 'parenthetical':
        lines.push(`(${text.replace(/^\(|\)$/g, '')})`);
        break;
      case 'dialogue':
        lines.push(text);
        break;
      case 'transition':
        lines.push(`                               ${text.toUpperCase()}`);
        break;
      case 'shot':
        lines.push(text.toUpperCase());
        break;
      default:
        lines.push(text);
    }
    lines.push('');
  });
  
  return lines.join('\n');
}

export function exportToHTML(content, title = 'Untitled Script') {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  // Get the editor content
  const editorContent = doc.querySelector('.screenplay-editor') || doc.body;
  
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Courier Prime', 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.0; color: #000; background: #fff; max-width: 8.5in; margin: 0 auto; padding: 1in 1.5in; min-height: 11in; }
    .screenplay-element { margin: 0; padding: 0; white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 12pt; line-height: 1.0; }
    .screenplay-scene-heading { margin: 24pt 0 12pt 0; text-transform: uppercase; font-weight: bold; }
    .screenplay-action { margin: 12pt 0; text-align: justify; }
    .screenplay-character { margin: 12pt 0 0 222pt; max-width: 222pt; text-transform: uppercase; font-weight: bold; page-break-after: avoid; }
    .screenplay-parenthetical { margin: 6pt 0 6pt 186pt; max-width: 150pt; font-style: italic; page-break-after: avoid; }
    .screenplay-dialogue { margin: 0 0 12pt 150pt; max-width: 252pt; }
    .screenplay-transition { margin: 24pt 0 12pt auto; text-align: right; text-transform: uppercase; font-weight: bold; max-width: 360pt; page-break-before: avoid; }
    .screenplay-shot { margin: 12pt 0; font-style: italic; text-transform: uppercase; }
    @media print { body { margin: 0; padding: 1in 1.5in; } .screenplay-element { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  ${editorContent.innerHTML}
</body>
</html>`;
  
  return fullHTML;
}

export function downloadBlob(content, mimeType, filename) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printScreenplay(content, title = 'Screenplay') {
  const printWindow = window.open('', '_blank');
  const html = exportToHTML(content, title);
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 500);
}
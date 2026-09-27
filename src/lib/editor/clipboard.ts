import { Block, BlockType, ChecklistItem, TableData } from '../../types/notebook';

/**
 * Dedicated Clipboard utility for JNAS Notebook.
 * Handles bidirectional Copy and Paste for:
 * - Microsoft OneNote (HTML, tables, checklists, images, lists, formatting)
 * - Microsoft Word & Google Docs
 * - Web browsers & Notepad
 * - Windows Snipping tool & clipboard screenshots
 */

// Generate clean semantic HTML for copying out of JNAS Notebook
export function cleanHTMLForClipboard(blocks: Block[], pageTitle?: string): string {
  const parts: string[] = [];

  if (pageTitle) {
    parts.push(`<h1>${escapeHTML(pageTitle)}</h1>`);
  }

  for (const block of blocks) {
    switch (block.type) {
      case 'heading1':
        parts.push(`<h1>${escapeHTML(block.content)}</h1>`);
        break;
      case 'heading2':
        parts.push(`<h2>${escapeHTML(block.content)}</h2>`);
        break;
      case 'heading3':
        parts.push(`<h3>${escapeHTML(block.content)}</h3>`);
        break;
      case 'checklist': {
        const items = block.metadata?.checklistItems || [];
        if (items.length > 0) {
          const listHtml = items
            .map((item) => {
              const mark = item.completed ? '☑' : '☐';
              const text = item.completed ? `<s>${escapeHTML(item.text)}</s>` : escapeHTML(item.text);
              return `<li style="list-style-type: none; margin: 4px 0;">${mark} ${text}</li>`;
            })
            .join('\n');
          parts.push(`<ul style="padding-left: 0; margin: 8px 0;">\n${listHtml}\n</ul>`);
        }
        break;
      }
      case 'table': {
        const tableData = block.metadata?.tableData;
        if (tableData && (tableData.headers?.length || tableData.rows?.length)) {
          let tableHtml = '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 12px 0;">\n';
          if (tableData.headers?.length) {
            tableHtml += '  <thead>\n    <tr style="background: #f1f5f9;">\n';
            for (const h of tableData.headers) {
              tableHtml += `      <th style="padding: 6px 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left;">${escapeHTML(h)}</th>\n`;
            }
            tableHtml += '    </tr>\n  </thead>\n';
          }
          if (tableData.rows?.length) {
            tableHtml += '  <tbody>\n';
            for (const row of tableData.rows) {
              tableHtml += '    <tr>\n';
              for (const cell of row) {
                tableHtml += `      <td style="padding: 6px 10px; border: 1px solid #cbd5e1;">${escapeHTML(cell)}</td>\n`;
              }
              tableHtml += '    </tr>\n';
            }
            tableHtml += '  </tbody>\n';
          }
          tableHtml += '</table>';
          parts.push(tableHtml);
        }
        break;
      }
      case 'code': {
        const lang = block.metadata?.language || 'plaintext';
        parts.push(
          `<pre style="background: #1e293b; color: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; overflow-x: auto;"><code data-lang="${escapeHTML(lang)}">${escapeHTML(block.content)}</code></pre>`
        );
        break;
      }
      case 'quote':
        parts.push(
          `<blockquote style="border-left: 4px solid #6366f1; padding-left: 12px; margin: 8px 0; color: #475569; font-style: italic;">${escapeHTML(block.content)}</blockquote>`
        );
        break;
      case 'callout':
        parts.push(
          `<div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 10px 14px; margin: 8px 0;">${escapeHTML(block.content)}</div>`
        );
        break;
      case 'image': {
        const imgUrl = block.metadata?.fileUrl || block.content;
        const caption = block.metadata?.caption;
        if (imgUrl) {
          parts.push(
            `<figure style="margin: 12px 0; text-align: center;"><img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(caption || 'Image')}" style="max-width: 100%; height: auto; border-radius: 8px;" />${caption ? `<figcaption style="font-size: 12px; color: #64748b; margin-top: 4px;">${escapeHTML(caption)}</figcaption>` : ''}</figure>`
          );
        }
        break;
      }
      case 'file': {
        const fileUrl = block.metadata?.fileUrl || block.content;
        const fileName = block.metadata?.fileName || 'Attached file';
        parts.push(`<p><a href="${escapeHTML(fileUrl)}" target="_blank" rel="noopener">${escapeHTML(fileName)}</a></p>`);
        break;
      }
      case 'divider':
        parts.push('<hr style="border: 0; border-top: 1px solid #cbd5e1; margin: 16px 0;" />');
        break;
      case 'text':
      default: {
        if (block.content.trim()) {
          // If content contains inline HTML (like <strong> or <em> or <a>), keep safe tags, else paragraph
          parts.push(`<p style="margin: 4px 0; line-height: 1.6;">${block.content}</p>`);
        }
        break;
      }
    }
  }

  return `<!--StartFragment-->\n${parts.join('\n')}\n<!--EndFragment-->`;
}

// Generate clean plain text for copying
export function plainTextForClipboard(blocks: Block[], pageTitle?: string): string {
  const parts: string[] = [];

  if (pageTitle) {
    parts.push(pageTitle + '\n' + '='.repeat(pageTitle.length));
  }

  for (const block of blocks) {
    switch (block.type) {
      case 'heading1':
        parts.push(`\n# ${block.content}\n`);
        break;
      case 'heading2':
        parts.push(`\n## ${block.content}\n`);
        break;
      case 'heading3':
        parts.push(`\n### ${block.content}\n`);
        break;
      case 'checklist': {
        const items = block.metadata?.checklistItems || [];
        const lines = items.map((i) => `${i.completed ? '[x]' : '[ ]'} ${i.text}`);
        parts.push(lines.join('\n'));
        break;
      }
      case 'table': {
        const tableData = block.metadata?.tableData;
        if (tableData) {
          const tableLines: string[] = [];
          if (tableData.headers?.length) {
            tableLines.push(tableData.headers.join('\t'));
          }
          if (tableData.rows?.length) {
            for (const row of tableData.rows) {
              tableLines.push(row.join('\t'));
            }
          }
          parts.push(tableLines.join('\n'));
        }
        break;
      }
      case 'code':
        parts.push(`\`\`\`${block.metadata?.language || ''}\n${block.content}\n\`\`\``);
        break;
      case 'quote':
        parts.push(`> ${block.content}`);
        break;
      case 'divider':
        parts.push('---');
        break;
      case 'image':
        parts.push(`![${block.metadata?.caption || 'Image'}](${block.metadata?.fileUrl || block.content})`);
        break;
      case 'file':
        parts.push(`[${block.metadata?.fileName || 'File'}](${block.metadata?.fileUrl || block.content})`);
        break;
      case 'text':
      default:
        if (block.content.trim()) {
          // Strip basic HTML tags if any were in content
          const text = block.content.replace(/<[^>]+>/g, '');
          parts.push(text);
        }
        break;
    }
  }

  return parts.join('\n\n');
}

// Copy blocks to system clipboard using modern Clipboard API with clean HTML + text/plain
export async function copyBlocksToClipboard(blocks: Block[], pageTitle?: string): Promise<boolean> {
  const html = cleanHTMLForClipboard(blocks, pageTitle);
  const text = plainTextForClipboard(blocks, pageTitle);

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const htmlBlob = new Blob([html], { type: 'text/html' });
      const textBlob = new Blob([text], { type: 'text/plain' });
      const item = new ClipboardItem({
        'text/html': htmlBlob,
        'text/plain': textBlob,
      });
      await navigator.clipboard.write([item]);
      return true;
    }
  } catch (err) {
    console.warn('ClipboardItem write failed, trying text fallback:', err);
  }

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Copy to clipboard failed completely:', err);
    return false;
  }
}

// Safely sanitize pasted HTML: remove scripts, iframes, inline event listeners, javascript: links
export function sanitizeHTML(dirtyHtml: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(dirtyHtml, 'text/html');

  // Strip hazardous tags
  const hazardousTags = ['script', 'style', 'iframe', 'object', 'embed', 'applet', 'meta', 'link', 'form', 'button'];
  for (const tag of hazardousTags) {
    const elements = doc.querySelectorAll(tag);
    elements.forEach((el) => el.remove());
  }

  // Strip event handlers (onload, onerror, onclick, etc.) and dangerous attributes
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const val = attr.value.toLowerCase().trim();
      if (name.startsWith('on') || val.startsWith('javascript:') || val.startsWith('vbscript:')) {
        el.removeAttribute(attr.name);
      }
    }
  });

  return doc.body.innerHTML;
}

// Normalize OneNote and Word HTML:
// Extracts content inside <!--StartFragment-->...<!--EndFragment-->
// Strips MSO specific styles, cleans list items, recognizes OneNote checkboxes
export function normalizeOneNoteHTML(html: string): string {
  let normalized = html;

  // Extract fragment if present
  const fragmentMatch = normalized.match(/<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i);
  if (fragmentMatch && fragmentMatch[1]) {
    normalized = fragmentMatch[1];
  }

  // Clean Word/OneNote conditional comments: <!--[if ...]>...<![endif]-->
  normalized = normalized.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '');
  // Clean comments
  normalized = normalized.replace(/<!--[\s\S]*?-->/g, '');

  return sanitizeHTML(normalized);
}

// Parse sanitized HTML into JNAS Notebook Block objects
export function parseHTMLToBlocks(
  html: string,
  userId: string,
  pageId: string,
  startPosition = 0
): Block[] {
  const cleanHtml = normalizeOneNoteHTML(html);
  const parser = new DOMParser();
  const doc = parser.parseFromString(cleanHtml, 'text/html');
  const blocks: Block[] = [];
  let currentPos = startPosition;

  const createBlockId = () => 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  const childNodes = Array.from(doc.body.childNodes);

  for (const node of childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node.textContent || '').trim();
      if (text) {
        blocks.push({
          id: createBlockId(),
          page_id: pageId,
          user_id: userId,
          type: 'text',
          content: text,
          position: currentPos++,
          created_at: now,
          updated_at: now,
        });
      }
      continue;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // 1. Table
    if (tagName === 'table') {
      const rows: string[][] = [];
      let headers: string[] = [];

      const trs = Array.from(el.querySelectorAll('tr'));
      if (trs.length > 0) {
        // Check if first row has th elements
        const firstTr = trs[0];
        const ths = Array.from(firstTr.querySelectorAll('th'));
        if (ths.length > 0) {
          headers = ths.map((th) => (th.textContent || '').trim());
          trs.shift(); // Remove header row from body rows
        } else {
          // Synthesize headers from first row
          const tds = Array.from(firstTr.querySelectorAll('td'));
          headers = tds.map((td, idx) => (td.textContent || '').trim() || `Col ${idx + 1}`);
          trs.shift();
        }

        for (const tr of trs) {
          const cells = Array.from(tr.querySelectorAll('td, th')).map((c) => (c.textContent || '').trim());
          if (cells.length > 0) {
            // Pad or trim cells to match header length
            while (cells.length < headers.length) cells.push('');
            rows.push(cells.slice(0, headers.length));
          }
        }
      }

      if (headers.length === 0) headers = ['Col 1', 'Col 2'];
      if (rows.length === 0) rows.push(new Array(headers.length).fill(''));

      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'table',
        content: '',
        position: currentPos++,
        metadata: {
          tableData: { headers, rows },
        },
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // 2. Headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
      const blockType: BlockType = tagName === 'h1' ? 'heading1' : tagName === 'h2' ? 'heading2' : 'heading3';
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: blockType,
        content: (el.textContent || '').trim(),
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // 3. Code Block
    if (tagName === 'pre' || tagName === 'code') {
      const codeText = el.textContent || '';
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'code',
        content: codeText,
        position: currentPos++,
        metadata: { language: 'typescript' },
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // 4. Blockquote
    if (tagName === 'blockquote') {
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'quote',
        content: (el.textContent || '').trim(),
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // 5. Divider (hr)
    if (tagName === 'hr') {
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'divider',
        content: '',
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // 6. Image
    if (tagName === 'img') {
      const src = el.getAttribute('src');
      const alt = el.getAttribute('alt') || '';
      if (src) {
        blocks.push({
          id: createBlockId(),
          page_id: pageId,
          user_id: userId,
          type: 'image',
          content: src,
          position: currentPos++,
          metadata: { fileUrl: src, altText: alt, caption: alt },
          created_at: now,
          updated_at: now,
        });
      }
      continue;
    }

    // 7. Lists (ul, ol) - Check if checklist or normal list
    if (tagName === 'ul' || tagName === 'ol') {
      const lis = Array.from(el.querySelectorAll('li'));
      const checklistItems: ChecklistItem[] = [];
      const normalListLines: string[] = [];

      let hasChecklistItems = false;
      for (const li of lis) {
        const rawText = (li.textContent || '').trim();
        // Check for checkbox markers: [ ], [x], ☑, ☐, or input[type=checkbox]
        const hasCheckboxInput = li.querySelector('input[type="checkbox"]');
        const isChecked =
          hasCheckboxInput?.hasAttribute('checked') ||
          rawText.startsWith('☑') ||
          rawText.startsWith('[x]') ||
          rawText.startsWith('[X]');
        const isUnchecked =
          (hasCheckboxInput && !hasCheckboxInput.hasAttribute('checked')) ||
          rawText.startsWith('☐') ||
          rawText.startsWith('[ ]');

        if (hasCheckboxInput || isChecked || isUnchecked) {
          hasChecklistItems = true;
          const cleanText = rawText.replace(/^(☑|☐|\[\s?[xX]?\s?\])\s*/, '');
          checklistItems.push({
            id: 'ci_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
            text: cleanText || 'Task item',
            completed: Boolean(isChecked),
            priority: 'medium',
          });
        } else {
          normalListLines.push(`• ${rawText}`);
        }
      }

      if (hasChecklistItems && checklistItems.length > 0) {
        blocks.push({
          id: createBlockId(),
          page_id: pageId,
          user_id: userId,
          type: 'checklist',
          content: '',
          position: currentPos++,
          metadata: { checklistItems },
          created_at: now,
          updated_at: now,
        });
      }

      if (normalListLines.length > 0) {
        for (const line of normalListLines) {
          blocks.push({
            id: createBlockId(),
            page_id: pageId,
            user_id: userId,
            type: 'text',
            content: line,
            position: currentPos++,
            created_at: now,
            updated_at: now,
          });
        }
      }
      continue;
    }

    // 8. Paragraphs / Divs
    const textContent = (el.textContent || '').trim();
    if (textContent) {
      // Check if paragraph contains checkbox symbols: ☑ or ☐ or [ ] or [x]
      if (
        textContent.startsWith('☑') ||
        textContent.startsWith('☐') ||
        textContent.startsWith('[ ]') ||
        textContent.startsWith('[x]') ||
        textContent.startsWith('[X]')
      ) {
        const isChecked = textContent.startsWith('☑') || textContent.startsWith('[x]') || textContent.startsWith('[X]');
        const cleanText = textContent.replace(/^(☑|☐|\[\s?[xX]?\s?\])\s*/, '');
        blocks.push({
          id: createBlockId(),
          page_id: pageId,
          user_id: userId,
          type: 'checklist',
          content: '',
          position: currentPos++,
          metadata: {
            checklistItems: [
              {
                id: 'ci_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
                text: cleanText,
                completed: isChecked,
                priority: 'medium',
              },
            ],
          },
          created_at: now,
          updated_at: now,
        });
      } else {
        blocks.push({
          id: createBlockId(),
          page_id: pageId,
          user_id: userId,
          type: 'text',
          content: textContent,
          position: currentPos++,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return blocks;
}

// Parse plain text (or Ctrl+Shift+V) into Blocks while preserving paragraphs, headings, and checklists
export function parsePlainTextToBlocks(
  text: string,
  userId: string,
  pageId: string,
  startPosition = 0
): Block[] {
  const blocks: Block[] = [];
  const lines = text.split(/\r?\n/);
  let currentPos = startPosition;

  const createBlockId = () => 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  const now = new Date().toISOString();

  let pendingChecklistItems: ChecklistItem[] = [];

  const flushChecklist = () => {
    if (pendingChecklistItems.length > 0) {
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'checklist',
        content: '',
        position: currentPos++,
        metadata: { checklistItems: [...pendingChecklistItems] },
        created_at: now,
        updated_at: now,
      });
      pendingChecklistItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushChecklist();
      continue;
    }

    // Heading 1 (# ...)
    if (trimmed.startsWith('# ')) {
      flushChecklist();
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'heading1',
        content: trimmed.substring(2).trim(),
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // Heading 2 (## ...)
    if (trimmed.startsWith('## ')) {
      flushChecklist();
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'heading2',
        content: trimmed.substring(3).trim(),
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // Heading 3 (### ...)
    if (trimmed.startsWith('### ')) {
      flushChecklist();
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'heading3',
        content: trimmed.substring(4).trim(),
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // Checklist marker (☐, ☑, [ ], [x], - [ ], - [x], * [ ], * [x])
    const checklistRegex = /^(\*|-)?\s*(☑|☐|\[\s?[xX]?\s?\])\s*(.*)$/;
    const checkMatch = trimmed.match(checklistRegex);
    if (checkMatch) {
      const marker = checkMatch[2];
      const itemText = checkMatch[3] || 'Task';
      const isChecked = marker === '☑' || marker.toLowerCase().includes('x');

      pendingChecklistItems.push({
        id: 'ci_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        text: itemText,
        completed: isChecked,
        priority: 'medium',
      });
      continue;
    }

    // Divider (--- or ***)
    if (trimmed === '---' || trimmed === '***') {
      flushChecklist();
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'divider',
        content: '',
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // Quote (> ...)
    if (trimmed.startsWith('> ')) {
      flushChecklist();
      blocks.push({
        id: createBlockId(),
        page_id: pageId,
        user_id: userId,
        type: 'quote',
        content: trimmed.substring(2).trim(),
        position: currentPos++,
        created_at: now,
        updated_at: now,
      });
      continue;
    }

    // Regular paragraph
    flushChecklist();
    blocks.push({
      id: createBlockId(),
      page_id: pageId,
      user_id: userId,
      type: 'text',
      content: trimmed,
      position: currentPos++,
      created_at: now,
      updated_at: now,
    });
  }

  flushChecklist();
  return blocks;
}

// Master paste dispatcher for editor container
export async function processClipboardPaste(
  e: React.ClipboardEvent | ClipboardEvent,
  options: {
    userId: string;
    pageId: string;
    insertPosition: number;
    onInsertBlocks: (newBlocks: Block[]) => void;
    onUploadImage: (file: File) => Promise<string>;
  }
): Promise<boolean> {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return false;

  // 1. Check for image files in clipboard (Windows Snipping Tool, copied OneNote image, screenshot)
  const items = Array.from(clipboardData.items || []);
  const imageItem = items.find((item) => item.type.startsWith('image/'));

  if (imageItem) {
    const file = imageItem.getAsFile();
    if (file) {
      e.preventDefault();
      // Insert placeholder block
      const tempId = 'blk_img_' + Date.now().toString(36);
      const placeholderBlock: Block = {
        id: tempId,
        page_id: options.pageId,
        user_id: options.userId,
        type: 'image',
        content: '',
        position: options.insertPosition,
        metadata: { caption: 'Uploading image...' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      options.onInsertBlocks([placeholderBlock]);

      try {
        const uploadedUrl = await options.onUploadImage(file);
        placeholderBlock.content = uploadedUrl;
        placeholderBlock.metadata = {
          fileUrl: uploadedUrl,
          fileName: file.name || 'Pasted Image',
          fileSize: file.size,
          fileType: file.type,
          caption: '',
        };
        options.onInsertBlocks([placeholderBlock]);
      } catch (err) {
        console.error('Image upload failed during paste:', err);
      }
      return true;
    }
  }

  // 2. Check for HTML format (OneNote, Word, Google Docs, browser webpages)
  const htmlData = clipboardData.getData('text/html');
  if (htmlData && htmlData.trim()) {
    e.preventDefault();
    const blocks = parseHTMLToBlocks(htmlData, options.userId, options.pageId, options.insertPosition);
    if (blocks.length > 0) {
      options.onInsertBlocks(blocks);
      return true;
    }
  }

  // 3. Fallback to plain text
  const plainText = clipboardData.getData('text/plain');
  if (plainText && plainText.trim()) {
    e.preventDefault();
    const blocks = parsePlainTextToBlocks(plainText, options.userId, options.pageId, options.insertPosition);
    if (blocks.length > 0) {
      options.onInsertBlocks(blocks);
      return true;
    }
  }

  return false;
}

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

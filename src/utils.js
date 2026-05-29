import fs from 'fs';
import path from 'path';

export const LANGUAGE_MAP = {
  cpp: { name: 'C++', ext: 'cpp' },
  java: { name: 'Java', ext: 'java' },
  python: { name: 'Python', ext: 'py' },
  python3: { name: 'Python3', ext: 'py' },
  csharp: { name: 'C#', ext: 'cs' },
  javascript: { name: 'JavaScript', ext: 'js' },
  typescript: { name: 'TypeScript', ext: 'ts' },
  php: { name: 'PHP', ext: 'php' },
  swift: { name: 'Swift', ext: 'swift' },
  kotlin: { name: 'Kotlin', ext: 'kt' },
  rust: { name: 'Rust', ext: 'rs' },
  golang: { name: 'Go', ext: 'go' },
  go: { name: 'Go', ext: 'go' },
  ruby: { name: 'Ruby', ext: 'rb' },
  scala: { name: 'Scala', ext: 'scala' },
  erlang: { name: 'Erlang', ext: 'erl' },
  elixir: { name: 'Elixir', ext: 'ex' }
};

// Convert HTML to basic Markdown
export function htmlToMarkdown(html) {
  if (!html) return '';

  let md = html;

  // Replace block tags
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, code) => {
    // strip inner HTML from code block
    const cleanCode = code.replace(/<[^>]+>/g, '');
    return `\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n`;
  });

  md = md.replace(/<p[^>]*>/gi, '\n').replace(/<\/p>/gi, '\n');
  md = md.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<div[^>]*>/gi, '\n').replace(/<\/div>/gi, '\n');

  // Replace lists
  md = md.replace(/<ul[^>]*>/gi, '\n').replace(/<\/ul>/gi, '\n');
  md = md.replace(/<ol[^>]*>/gi, '\n').replace(/<\/ol>/gi, '\n');
  md = md.replace(/<li[^>]*>/gi, '\n* ').replace(/<\/li>/gi, '');

  // Replace text formatting
  md = md.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Remove any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');

  // HTML entities decoding
  const entities = {
    '&nbsp;': ' ',
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&deg;': '°',
    '&le;': '≤',
    '&ge;': '≥',
    '&plusmn;': '±',
    '&times;': '×',
    '&divide;': '÷',
    '&sup2;': '²',
    '&sup3;': '³',
  };

  for (const [entity, replacement] of Object.entries(entities)) {
    md = md.replace(new RegExp(entity, 'g'), replacement);
  }

  // Clean up excess newlines
  md = md.replace(/\n{3,}/g, '\n\n');

  return md.trim();
}

// Find extension by langSlug
export function getExtensionForLang(langSlug) {
  return LANGUAGE_MAP[langSlug]?.ext || 'txt';
}

// Find langSlug by filename extension
export function getLangSlugFromPath(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  for (const [slug, info] of Object.entries(LANGUAGE_MAP)) {
    if (info.ext === ext) {
      return slug;
    }
  }
  return null;
}

// Format difficulty with colors (using Clack style / raw ansi colors)
export function formatDifficulty(difficulty) {
  switch (difficulty?.toLowerCase()) {
    case 'easy':
      return '\x1b[32mEasy\x1b[0m'; // Green
    case 'medium':
      return '\x1b[33mMedium\x1b[0m'; // Yellow
    case 'hard':
      return '\x1b[31mHard\x1b[0m'; // Red
    default:
      return difficulty || 'Unknown';
  }
}

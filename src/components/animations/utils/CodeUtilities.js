// module id: 737322 (Code Utilities)

export function stripComments(code, lang = 'js') {
  if (!code || typeof code !== 'string') return code;
  
  const language = String(lang).toLowerCase();
  
  let strippedCode;
  if (language === 'html') {
    strippedCode = code.replace(/<!--[\s\S]*?-->/g, '');
  } else if (language === 'css' || language === 'scss') {
    strippedCode = processString(code, false);
  } else if (language === 'vue' || language === 'svelte') {
    strippedCode = processString(code.replace(/<!--[\s\S]*?-->/g, ''), true);
  } else {
    strippedCode = processString(code, true);
  }
  
  return strippedCode
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*\n+/, '');
}

function processString(input, isJsOrSimilar) {
  let result = '';
  let i = 0;
  const len = input.length;
  let quoteChar = null;

  while (i < len) {
    const char = input[i];
    const nextChar = input[i + 1];

    if (quoteChar) {
      result += char;
      if (char === '\\') {
        result += nextChar ?? '';
        i += 2;
        continue;
      }
      if (char === quoteChar) {
        quoteChar = null;
      }
      i++;
      continue;
    }

    if (char === '"' || char === "'" || char === '`') {
      quoteChar = char;
      result += char;
      i++;
      continue;
    }

    // Multi-line comment
    if (char === '/' && nextChar === '*') {
      i += 2;
      while (i < len && (input[i] !== '*' || input[i + 1] !== '/')) {
        i++;
      }
      i += 2;
      continue;
    }

    // Single-line comment
    if (isJsOrSimilar && char === '/' && nextChar === '/') {
      let backIndex = result.length - 1;
      while (backIndex >= 0 && (result[backIndex] === ' ' || result[backIndex] === '\t')) {
        backIndex--;
      }
      
      // Keep URLs (e.g. http://)
      if (backIndex >= 0 && result[backIndex] === ':') {
        result += char;
        i++;
        continue;
      }
      
      while (i < len && input[i] !== '\n') {
        i++;
      }
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

export function stripLangFor(platform, tab) {
  const tabLower = String(tab || '').toLowerCase();
  if (tabLower === 'css') return 'css';
  if (tabLower === 'html') return 'html';
  if (platform === 'vue') return 'vue';
  return 'js';
}

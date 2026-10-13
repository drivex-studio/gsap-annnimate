import {
  EditorView,
  Decoration,
  ViewPlugin,
  keymap,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  highlightSpecialChars,
  lineNumbers,
  highlightActiveLineGutter,
} from '@codemirror/view';
import { EditorState, RangeSetBuilder } from '@codemirror/state';
import {
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  HighlightStyle,
} from '@codemirror/language';
import { history, defaultKeymap, historyKeymap } from '@codemirror/commands';
import {
  closeBrackets,
  autocompletion,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete';
import { tags as t } from '@lezer/highlight';

// --- 1. Theme & Syntax Highlighting ---
const COLOR_CARET = '#ff7a32';
const COLOR_BG = 'transparent';
const COLOR_FG = '#c9d1d9';
const COLOR_COMMENT = '#8b949e';
const COLOR_STRING = '#a5d6ff';
const COLOR_NUMBER = '#79c0ff';
const COLOR_KEYWORD = '#ff7b72';
const COLOR_FUNCTION = '#d2a8ff';
const COLOR_VARIABLE = '#ffa657';
const COLOR_HIGHLIGHT_VAL = '#ff9a5c';

const anmBaseTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: COLOR_BG,
      color: COLOR_FG,
      fontSize: '13px',
      fontFamily: 'var(--font-geist-mono), monospace',
    },
    '.cm-content': {
      padding: '16px 0',
      caretColor: COLOR_CARET,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: COLOR_CARET,
      borderLeftWidth: '2px',
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: 'rgba(255, 122, 50, 0.20)',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-gutters': {
      backgroundColor: COLOR_BG,
      color: '#6e7681',
      border: 'none',
      paddingLeft: '8px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent',
      color: '#c9d1d9',
    },
    '.cm-anm-attr-highlight': {
      color: `${COLOR_CARET} !important`,
      fontWeight: '500',
    },
    '.cm-anm-value-highlight': {
      color: `${COLOR_HIGHLIGHT_VAL} !important`,
    },
    '.cm-tooltip-autocomplete': {
      backgroundColor: 'var(--background)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '6px',
      overflow: 'hidden',
    },
    '.cm-tooltip-autocomplete ul li[aria-selected]': {
      backgroundColor: 'rgba(255, 122, 50, 0.15)',
      color: COLOR_CARET,
    },
  },
  { dark: true }
);

const anmHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: COLOR_KEYWORD },
  { tag: t.controlKeyword, color: COLOR_KEYWORD },
  { tag: t.string, color: COLOR_STRING },
  { tag: t.number, color: COLOR_NUMBER },
  { tag: t.comment, color: COLOR_COMMENT },
  { tag: t.function(t.variableName), color: COLOR_FUNCTION },
  { tag: t.variableName, color: COLOR_VARIABLE },
  { tag: t.tagName, color: '#7ee787' },
  { tag: t.attributeName, color: '#79c0ff' },
  { tag: t.attributeValue, color: COLOR_STRING },
]);

const anmTheme = [anmBaseTheme, syntaxHighlighting(anmHighlightStyle)];

// --- 2. Decorator for `data-anm-*` attributes ---
const attrMark = Decoration.mark({ class: 'cm-anm-attr-highlight' });
const valMark = Decoration.mark({ class: 'cm-anm-value-highlight' });

function buildAnmDecorations(view) {
  const builder = new RangeSetBuilder();
  const doc = view.state.doc;
  const matches = [];

  for (const { from, to } of view.visibleRanges) {
    const str = doc.sliceString(from, to);
    let match;

    // data-anm-xyz
    const attrRegex = /data-anm-[a-zA-Z0-9-]+/g;
    while ((match = attrRegex.exec(str)) !== null) {
      matches.push({
        from: from + match.index,
        to: from + match.index + match[0].length,
        decoration: attrMark,
      });
    }

    // data-anm-xyz="value"
    const valRegex = /data-anm-[a-zA-Z0-9-]+="([^"]*)"/g;
    while ((match = valRegex.exec(str)) !== null) {
      if (match[1]) {
        const valStart = from + match.index + match[0].indexOf('="') + 2;
        const valEnd = valStart + match[1].length;
        if (valEnd > valStart) {
          matches.push({ from: valStart, to: valEnd, decoration: valMark });
        }
      }
    }
  }

  matches.sort((a, b) => a.from - b.from || a.to - b.to);
  for (const { from, to, decoration } of matches) {
    builder.add(from, to, decoration);
  }
  return builder.finish();
}

const anmDecoratorPlugin = ViewPlugin.fromClass(
  class {
    constructor(view) {
      this.decorations = buildAnmDecorations(view);
    }
    update(update) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildAnmDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations }
);

const anmThemeExtensions = [...anmTheme, anmDecoratorPlugin];

// --- 3. Autocomplete for `data-anm-*` attributes ---
// TODO: original full attribute list was not recoverable from the bundle
// (only these 4 were present in the snippet). Add the rest here.
const ANM_ATTRIBUTES = {
  'magnetic-button': { type: 'keyword', info: 'Main magnetic button trigger' },
  'scroll-reveal': { type: 'keyword', info: 'Scroll-triggered reveal animation' },
  duration: { defaultValue: '0.8', detail: 'seconds', info: 'Animation duration in seconds' },
  ease: { defaultValue: 'power4.out', detail: 'easing', info: 'GSAP easing function' },
};

function createAnmAutocomplete(keys = Object.keys(ANM_ATTRIBUTES)) {
  const options = keys.map((k) => {
    const spec = ANM_ATTRIBUTES[k] || {};
    const attrName = `data-anm-${k}`;
    if (spec.type !== 'keyword' && spec.defaultValue) {
      return {
        label: `${attrName}="${spec.defaultValue}"`,
        displayLabel: attrName,
        type: 'property',
        detail: spec.detail,
        info: spec.info,
      };
    }
    return {
      label: attrName,
      type: spec.type || 'keyword',
      info: spec.info || `${k} attribute`,
    };
  });

  return autocompletion({
    override: [
      (context) => {
        const match = context.matchBefore(/data-[a-zA-Z0-9-]*/);
        if (!match || (match.from === match.to && !context.explicit)) return null;
        return {
          from: match.from,
          options,
          validFor: /^data-[a-zA-Z0-9-]*$/,
        };
      },
    ],
    icons: false,
  });
}

// --- 4. Extract attribute names from a JS string ---
function parseAttributesFromJs(codeStr) {
  if (!codeStr) return [];
  const attrs = new Set();
  let match;

  // dataset.anmXyzAbc -> xyz-abc
  const datasetRegex = /dataset\.anm([A-Z][a-zA-Z]*)/g;
  while ((match = datasetRegex.exec(codeStr)) !== null) {
    const attr = match[1].replace(/([A-Z])/g, '-$1').toLowerCase().slice(1);
    attrs.add(attr);
  }

  // [data-anm-xyz]
  const bracketRegex = /\[data-anm-([a-z-]+)\]/g;
  while ((match = bracketRegex.exec(codeStr)) !== null) {
    attrs.add(match[1]);
  }

  return Array.from(attrs);
}

// --- 5. Basic setup ---
const basicSetup = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
  ]),
];

export {
  basicSetup,
  anmThemeExtensions,
  createAnmAutocomplete,
  parseAttributesFromJs,
};

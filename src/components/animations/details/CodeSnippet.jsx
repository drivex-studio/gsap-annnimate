"use client";
import React, { useState, useRef, useEffect } from 'react';
import { EditorState, EditorView, basicSetup } from '@codemirror/basic-setup';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { javascript } from '@codemirror/lang-javascript';
import { Copy, Check } from '@phosphor-icons/react';
import { anmThemeExtensions } from '@/libs/editor/setup';

const DEFAULT_FILENAMES = {
  html: 'example.html',
  css: 'styles.css',
  javascript: 'script.js',
  js: 'script.js',
  jsx: 'Component.jsx',
  vue: 'Component.vue'
};

function getLanguageExtension(lang) {
  switch (lang) {
    case 'css':
      return css();
    case 'javascript':
    case 'js':
      return javascript();
    case 'jsx':
      return javascript({ jsx: true });
    default:
      return html();
  }
}

export default function CodeSnippet({
  children,
  language = 'html',
  filename,
  copyable = true,
  className = '',
  maxHeight = '256px',
  fontSize = '13px',
  brandIndicator = false,
  headerless = false
}) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef(null);
  const editorViewRef = useRef(null);
  
  const content = typeof children === 'string' ? children : String(children);

  useEffect(() => {
    if (!containerRef.current) return;
    
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        getLanguageExtension(language),
        ...anmThemeExtensions,
        EditorView.editable.of(false),
        EditorView.lineWrapping
      ]
    });

    editorViewRef.current = new EditorView({
      state,
      parent: containerRef.current
    });

    return () => {
      editorViewRef.current?.destroy();
    };
  }, [content, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy code:', e);
    }
  };

  const displayFilename = filename || DEFAULT_FILENAMES[language] || language.toUpperCase();

  return (
    <div className={`flex h-full flex-col bg-background ${headerless ? '' : 'border border-foreground/10'} ${className}`}>
      {!headerless && (
        <div className="flex items-center justify-between border-b border-foreground/10 bg-foreground/[0.04] px-12 py-8">
          <span className="flex items-center gap-8">
            {brandIndicator && <span aria-hidden="true" className="inline-block size-8 bg-brand" />}
            <span className="text-accent-xs normal-case text-foreground-muted">
              {displayFilename}
            </span>
          </span>
          {copyable && (
            <button
              type="button"
              onClick={handleCopy}
              title="Copy to clipboard"
              className={`text-accent-xs flex items-center gap-6 px-8 py-4 transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) ${copied ? 'bg-brand text-[#141314]' : 'bg-foreground text-background hover:opacity-90'}`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              <span>{copied ? 'Copied.' : 'Copy'}</span>
            </button>
          )}
        </div>
      )}
      <div 
        ref={containerRef} 
        className="min-h-0 flex-1 overflow-auto" 
        style={{ maxHeight, fontSize }} 
      />
    </div>
  );
}

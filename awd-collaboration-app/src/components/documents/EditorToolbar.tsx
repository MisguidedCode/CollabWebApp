import React from 'react';
import { Editor } from '@tiptap/react';

// Common button styles
const buttonClass = `w-8 h-8 inline-flex items-center justify-center rounded cursor-pointer border border-gray-300 hover:bg-gray-100 active:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500`;
const activeButtonClass = `w-8 h-8 inline-flex items-center justify-center rounded cursor-pointer border border-primary-500 bg-primary-50 text-primary-600 hover:bg-primary-100 active:bg-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500`;
const disabledButtonClass = `w-8 h-8 inline-flex items-center justify-center rounded cursor-not-allowed border border-gray-200 bg-gray-50 text-gray-400`;

// Bold button
export const Bold = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleBold().run()}
      className={editor.isActive('bold') ? activeButtonClass : buttonClass}
      title="Bold"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    </button>
  );
};

// Italic button
export const Italic = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleItalic().run()}
      className={editor.isActive('italic') ? activeButtonClass : buttonClass}
      title="Italic"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </button>
  );
};

// Underline button
export const Underline = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleMark('underline').run()}
      className={editor.isActive('underline') ? activeButtonClass : buttonClass}
      title="Underline"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
};

// Code button
export const Code = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleCode().run()}
      className={editor.isActive('code') ? activeButtonClass : buttonClass}
      title="Inline Code"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </button>
  );
};

// Heading 1 button
export const Heading1 = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      className={editor.isActive('heading', { level: 1 }) ? activeButtonClass : buttonClass}
      title="Heading 1"
    >
      <span className="font-bold">H1</span>
    </button>
  );
};

// Heading 2 button
export const Heading2 = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      className={editor.isActive('heading', { level: 2 }) ? activeButtonClass : buttonClass}
      title="Heading 2"
    >
      <span className="font-bold">H2</span>
    </button>
  );
};

// Bullet list button
export const BulletList = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      className={editor.isActive('bulletList') ? activeButtonClass : buttonClass}
      title="Bullet List"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  );
};

// Ordered list button
export const OrderedList = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      className={editor.isActive('orderedList') ? activeButtonClass : buttonClass}
      title="Ordered List"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    </button>
  );
};

// Code block button
export const CodeBlock = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      className={editor.isActive('codeBlock') ? activeButtonClass : buttonClass}
      title="Code Block"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </button>
  );
};

// Blockquote button
export const Blockquote = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      className={editor.isActive('blockquote') ? activeButtonClass : buttonClass}
      title="Blockquote"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    </button>
  );
};

// Horizontal rule button
export const HorizontalRule = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  return (
    <button
      type="button"
      onClick={() => editor.chain().focus().setHorizontalRule().run()}
      className={buttonClass}
      title="Horizontal Rule"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16" />
      </svg>
    </button>
  );
};

// Undo button (updated for collaboration)
export const Undo = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  // For Collaboration mode, we need to check if undo is available differently
  const hasUndoMethod = typeof editor.commands.undo === 'function';
  
  return (
    <button
      type="button"
      onClick={() => hasUndoMethod && editor.chain().focus().undo().run()}
      className={disabledButtonClass}
      title="Undo (Disabled with Collaboration)"
      disabled={true}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
    </button>
  );
};

// Redo button (updated for collaboration)
export const Redo = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;
  
  // For Collaboration mode, we need to check if redo is available differently
  const hasRedoMethod = typeof editor.commands.redo === 'function';
  
  return (
    <button
      type="button"
      onClick={() => hasRedoMethod && editor.chain().focus().redo().run()}
      className={disabledButtonClass}
      title="Redo (Disabled with Collaboration)"
      disabled={true}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    </button>
  );
};

// Save button
export const Save = ({ onClick, isSaving }: { onClick: () => void; isSaving: boolean }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSaving}
      className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
        isSaving ? 'opacity-75 cursor-not-allowed' : ''
      }`}
      title="Save Document (Ctrl+S)"
    >
      {isSaving ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save
        </>
      )}
    </button>
  );
};
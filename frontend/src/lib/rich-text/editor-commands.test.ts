import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { Editor } from "@tiptap/core";
import { richTextExtensions } from "./extensions.ts";
import {
  getRichTextToolbarState,
  setBlockType,
  clearAllFormatting,
  setEditorContentWithoutHistory,
} from "./editor-commands.ts";

function installDom() {
  const dom = new JSDOM('<!doctype html><html><body><div id="editor"></div></body></html>', {
    pretendToBeVisual: true,
  });

  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    DOMParser: dom.window.DOMParser,
    Node: dom.window.Node,
    HTMLElement: dom.window.HTMLElement,
    getSelection: dom.window.getSelection.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
  });
}

test("external editor synchronization does not create an undo entry", () => {
  installDom();
  const editor = new Editor({
    element: document.querySelector("#editor") as HTMLElement,
    extensions: richTextExtensions,
  });

  setEditorContentWithoutHistory(editor, {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Loaded content" }] }],
  });

  assert.equal(editor.can().undo(), false);
  editor.destroy();
});

test("toolbar state reports a selected list, block type, and undo availability", () => {
  installDom();
  const editor = new Editor({
    element: document.querySelector("#editor") as HTMLElement,
    extensions: richTextExtensions,
  });

  editor.commands.insertContent("Item");
  editor.commands.toggleBulletList();

  const state = getRichTextToolbarState(editor);
  assert.equal(state.canUndo, true);
  assert.equal(state.canRedo, false);
  assert.equal(state.bulletList, true);
  assert.equal(state.blockType, "paragraph");
  assert.equal(state.bold, false);

  editor.destroy();
});

test("setBlockType correctly switches between headings, code block, quote and paragraph", () => {
  installDom();
  const editor = new Editor({
    element: document.querySelector("#editor") as HTMLElement,
    extensions: richTextExtensions,
  });

  editor.commands.setContent("<p>Sample Heading Text</p>");

  // Switch to H1
  setBlockType(editor, "heading1");
  assert.equal(getRichTextToolbarState(editor).blockType, "heading1");

  // Switch to H4
  setBlockType(editor, "heading4");
  assert.equal(getRichTextToolbarState(editor).blockType, "heading4");

  // Switch to Code Block
  setBlockType(editor, "codeBlock");
  assert.equal(getRichTextToolbarState(editor).blockType, "codeBlock");

  // Switch to Blockquote
  setBlockType(editor, "blockquote");
  assert.equal(getRichTextToolbarState(editor).blockType, "blockquote");

  // Switch back to Paragraph
  setBlockType(editor, "paragraph");
  assert.equal(getRichTextToolbarState(editor).blockType, "paragraph");

  editor.destroy();
});

test("clearAllFormatting resets marks and block nodes", () => {
  installDom();
  const editor = new Editor({
    element: document.querySelector("#editor") as HTMLElement,
    extensions: richTextExtensions,
  });

  editor.commands.setContent("<p><strong><em><u>Sample text</u></em></strong></p>");
  editor.commands.selectAll();
  clearAllFormatting(editor);

  const state = getRichTextToolbarState(editor);
  assert.equal(state.bold, false);
  assert.equal(state.italic, false);
  assert.equal(state.underline, false);

  editor.destroy();
});

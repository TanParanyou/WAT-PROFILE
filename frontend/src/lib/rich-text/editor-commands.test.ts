import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { getRichTextToolbarState, setEditorContentWithoutHistory } from "./editor-commands.ts";

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
    extensions: [StarterKit],
  });

  setEditorContentWithoutHistory(editor, {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: "Loaded content" }] }],
  });

  assert.equal(editor.can().undo(), false);
  editor.destroy();
});

test("toolbar state reports a selected list and the undo availability", () => {
  installDom();
  const editor = new Editor({
    element: document.querySelector("#editor") as HTMLElement,
    extensions: [StarterKit],
  });

  editor.commands.insertContent("Item");
  editor.commands.toggleBulletList();

  assert.deepEqual(getRichTextToolbarState(editor), {
    canUndo: true,
    canRedo: false,
    blockType: "paragraph",
    bold: false,
    italic: false,
    strike: false,
    bulletList: true,
    orderedList: false,
    blockquote: false,
    link: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
  });
  editor.destroy();
});

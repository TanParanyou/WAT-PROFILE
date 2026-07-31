import { Extension } from "@tiptap/core";

export const TabExtension = Extension.create({
  name: "tabExtension",

  addKeyboardShortcuts() {
    return {
      Tab: ({ editor }) => {
        // If the user is inside a list, we return false to let the list extension handle the Tab (indent list item)
        if (editor.isActive("listItem") || editor.isActive("bulletList") || editor.isActive("orderedList")) {
          return false;
        }
        return editor.commands.insertContent("\t");
      },
    };
  },
});

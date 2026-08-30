import Image from "@tiptap/extension-image";
import { Plugin, PluginKey, NodeSelection } from "@tiptap/pm/state";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageAlign: {
      /**
       * Set the image alignment
       */
      setImageAlign: (align: "left" | "center" | "right" | "full") => ReturnType;
    };
  }
}

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      align: {
        default: "center",
        parseHTML: (element) => element.getAttribute("data-align") || "center",
        renderHTML: (attributes) => {
          if (!attributes.align) {
            return {};
          }
          return {
            "data-align": attributes.align,
          };
        },
      },
    };
  },

  addCommands() {
    return {
      ...this.parent?.(),
      setImageAlign:
        (align: "left" | "center" | "right" | "full") =>
        ({ commands }) => {
          return commands.updateAttributes("image", { align });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      ...(this.parent?.() || []),
      new Plugin({
        key: new PluginKey("customImageSelection"),
        props: {
          handleClickOn(view, pos, node) {
            if (node.type.name === "image") {
              const { tr } = view.state;
              const selection = NodeSelection.create(view.state.doc, pos);
              view.dispatch(tr.setSelection(selection));
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});

import Image from "@tiptap/extension-image";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    imageAlign: {
      /**
       * Set the image alignment
       */
      setImageAlign: (align: "left" | "center" | "right") => ReturnType;
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
        (align: "left" | "center" | "right") =>
        ({ commands }) => {
          return commands.updateAttributes("image", { align });
        },
    };
  },
});

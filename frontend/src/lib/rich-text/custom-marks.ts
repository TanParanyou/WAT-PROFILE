import { Mark, Extension } from "@tiptap/core";

export const Subscript = Mark.create({
  name: "subscript",

  parseHTML() {
    return [
      { tag: "sub" },
      {
        style: "vertical-align",
        getAttrs: (value) => (value === "sub" ? {} : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sub", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      toggleSubscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      setSubscript:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      unsetSubscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export const Superscript = Mark.create({
  name: "superscript",

  parseHTML() {
    return [
      { tag: "sup" },
      {
        style: "vertical-align",
        getAttrs: (value) => (value === "super" ? {} : false),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["sup", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      toggleSuperscript:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name);
        },
      setSuperscript:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name);
        },
      unsetSuperscript:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

export const TextColor = Extension.create({
  name: "textColor",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          color: {
            default: null,
            parseHTML: (element) => element.style.color?.replace(/['"]+/g, "") || null,
            renderHTML: (attributes) => {
              if (!attributes.color) {
                return {};
              }
              return {
                style: `color: ${attributes.color}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setColor:
        (color: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { color }).run();
        },
      unsetColor:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { color: null }).removeEmptyTextStyle().run();
        },
    };
  },
});

export const Highlight = Mark.create({
  name: "highlight",

  addOptions() {
    return {
      multicolor: true,
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    if (!this.options.multicolor) {
      return {};
    }

    return {
      color: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-color") || element.style.backgroundColor || null,
        renderHTML: (attributes) => {
          if (!attributes.color) {
            return {};
          }
          return {
            "data-color": attributes.color,
            style: `background-color: ${attributes.color};`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "mark",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["mark", HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setHighlight:
        (attributes?: { color?: string }) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      toggleHighlight:
        (attributes?: { color?: string }) =>
        ({ commands }) => {
          return commands.toggleMark(this.name, attributes);
        },
      unsetHighlight:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-h": () => this.editor.commands.toggleHighlight(),
      "Mod-Shift-H": () => this.editor.commands.toggleHighlight(),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    subscript: {
      toggleSubscript: () => ReturnType;
      setSubscript: () => ReturnType;
      unsetSubscript: () => ReturnType;
    };
    superscript: {
      toggleSuperscript: () => ReturnType;
      setSuperscript: () => ReturnType;
      unsetSuperscript: () => ReturnType;
    };
    textColor: {
      setColor: (color: string) => ReturnType;
      unsetColor: () => ReturnType;
    };
    highlight: {
      setHighlight: (attributes?: { color?: string }) => ReturnType;
      toggleHighlight: (attributes?: { color?: string }) => ReturnType;
      unsetHighlight: () => ReturnType;
    };
  }
}

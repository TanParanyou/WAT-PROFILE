import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { FontSize } from "./font-size";
import { CustomImage } from "./custom-image";
import { TabExtension } from "./tab-extension";

export const richTextExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  CustomImage.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-4" } }),
  TextAlign.configure({ types: ["heading", "paragraph"] }),
  TextStyle,
  FontSize,
  TabExtension,
];

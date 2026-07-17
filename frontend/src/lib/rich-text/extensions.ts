import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";

export const richTextExtensions = [
  StarterKit.configure({ heading: { levels: [2, 3] } }),
  Link.configure({ openOnClick: false, autolink: true, linkOnPaste: true }),
  Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto my-4" } }),
];

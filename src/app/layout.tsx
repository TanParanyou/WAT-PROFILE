import { ReactNode } from 'react';

// Since we have a root layout in [locale]/layout.tsx that defines <html> and <body>,
// this root layout (src/app/layout.tsx) should strictly return children.
// However, we still need it to exist for Next.js to be happy about file structure,
// or we can delete it. But keeping it as pass-through is fine.

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import {
  Anuphan,
  Bai_Jamjuree,
  Noto_Sans_Thai,
  Trirong,
} from "next/font/google";
import ThemeExploration from "./ThemeExploration";

const body = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  variable: "--prototype-font-body",
  display: "swap",
});

const forestDisplay = Trirong({
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  variable: "--prototype-font-forest",
  display: "swap",
});

const community = Anuphan({
  subsets: ["thai", "latin"],
  variable: "--prototype-font-community",
  display: "swap",
});

const practice = Bai_Jamjuree({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--prototype-font-practice",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Client Theme Exploration · Wat Loung Por Sai",
  robots: { index: false, follow: false },
};

export default function ClientThemeExplorationPage() {
  return (
    <div
      className={[
        body.variable,
        forestDisplay.variable,
        community.variable,
        practice.variable,
      ].join(" ")}
    >
      <ThemeExploration />
    </div>
  );
}

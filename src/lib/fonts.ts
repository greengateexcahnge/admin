import { Inter } from "next/font/google";

/**
 * Primary typeface — Inter.
 * A modern, highly legible sans-serif. Loaded as a CSS variable so it can be
 * referenced from Tailwind's `--font-sans` token in globals.css.
 */
export const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

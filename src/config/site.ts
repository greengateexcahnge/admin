/**
 * Global, framework-agnostic app configuration.
 * Centralize names, URLs and metadata defaults here.
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "Greengate",
  description: "Greengate admin — crypto + fiat wallet operations console.",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en-US",
} as const;

export type SiteConfig = typeof siteConfig;

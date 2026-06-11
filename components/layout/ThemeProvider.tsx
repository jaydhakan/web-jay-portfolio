"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Dark is the brand default (deliberate, not system-following); the header
 * toggle persists the visitor's choice. `.light` on <html> swaps the tokens.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}

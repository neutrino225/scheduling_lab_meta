"use client";

import { ThemeProvider } from "@/lib/client/theme";

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

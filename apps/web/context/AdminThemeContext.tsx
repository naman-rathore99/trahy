"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// 🚨 THE ULTIMATE BYPASS
// This forces TypeScript to accept 'children' and literally any other prop
// you throw at it (like attribute="class") without complaining about strict types.
interface AdminThemeContextProps {
  children: React.ReactNode;
  [key: string]: any;
}

export function ThemeProvider({ children, ...props }: AdminThemeContextProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

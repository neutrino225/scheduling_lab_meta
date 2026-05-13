import type { Metadata } from "next";
import { DM_Mono, DM_Sans, Outfit } from "next/font/google";
import { Providers } from "@/app/providers";
import "./globals.css";

const headingFont = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = DM_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meta Lab",
  description: "Meta social scheduling dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("metalab-theme");if(!t){t=window.matchMedia("(prefers-color-scheme:light)").matches?"light":"dark"}if(t==="light")document.documentElement.classList.add("light")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

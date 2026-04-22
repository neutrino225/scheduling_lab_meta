import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { Providers } from "@/app/providers";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meta Lab",
  description: "Meta social scheduling dashboard",
};

const facebookAppId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
const facebookApiVersion = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v20.0";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {facebookAppId ? (
          <>
            <Script
              id="facebook-jssdk"
              src="https://connect.facebook.net/en_US/sdk.js"
              strategy="afterInteractive"
            />
            <Script id="facebook-init" strategy="afterInteractive">
              {`
                window.fbAsyncInit = function() {
                  FB.init({
                    appId: '${facebookAppId}',
                    cookie: true,
                    xfbml: true,
                    version: '${facebookApiVersion}'
                  });

                  FB.AppEvents.logPageView();
                };
              `}
            </Script>
          </>
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

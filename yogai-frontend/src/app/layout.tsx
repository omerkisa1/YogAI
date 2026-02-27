import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/layout/AuthProvider";
import { AppProvider } from "@/components/layout/AppProvider";
import { Toaster } from "react-hot-toast";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YogAI - AI-Powered Yoga Assistant",
  description:
    "Get personalized yoga plans and pose analysis powered by artificial intelligence.",
  keywords: ["yoga", "AI", "wellness", "fitness", "pose analysis"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("yogai-theme");if(t==="dark")document.documentElement.classList.add("dark");var l=localStorage.getItem("yogai-locale");if(l)document.documentElement.lang=l;}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <AppProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "rgb(var(--c-card))",
                  color: "rgb(var(--c-text))",
                  borderRadius: "1rem",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                },
              }}
            />
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

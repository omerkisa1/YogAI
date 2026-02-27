import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/layout/AuthProvider";
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
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#fff",
                color: "#2D2D2D",
                borderRadius: "1rem",
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}

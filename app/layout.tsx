import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Prowider | Lead Distribution System",
  description: "Next-gen persistent round-robin lead allocation and provider quota management platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
      <body className="min-h-screen bg-[#07070a] text-slate-100 font-sans flex flex-col antialiased selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
        {/* Glow ambient background circles */}
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none -z-10" />

        {/* Global Premium Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-[#07070a]/75 border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                  P
                </div>
                <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
                  PROWIDER
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                  Lead System
                </span>
              </div>
              <nav className="flex space-x-1 sm:space-x-4">
                <a
                  href="/request-service"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all duration-200"
                >
                  Request Service
                </a>
                <a
                  href="/dashboard"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all duration-200"
                >
                  Provider Dashboard
                </a>
                <a
                  href="/test-tools"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/40 transition-all duration-200"
                >
                  Test Tools
                </a>
              </nav>
            </div>
          </div>
        </header>

        {/* Page children */}
        <main className="flex-grow flex flex-col">{children}</main>

        {/* Global Footer */}
        <footer className="border-t border-slate-900 bg-[#040406] py-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <p>© {new Date().getFullYear()} Prowider Lead Distribution Inc. All rights reserved.</p>
            <p className="mt-2 text-slate-600">Built with Next.js App Router, Prisma, PostgreSQL & SSE Realtime.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

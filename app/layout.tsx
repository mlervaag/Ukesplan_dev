import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SWRConfig } from "swr";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Ukesplan",
    description: "Planlegg uken og handlelisten",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "Ukesplan",
    },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

// Inline script to prevent flash of wrong theme
const themeScript = `
(function() {
    try {
        var stored = localStorage.getItem('ukesplan-theme');
        var theme = stored || 'system';
        var isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) document.documentElement.classList.add('dark');
    } catch (e) {}
})();
`;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="no" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body className={inter.className}>
                <ThemeProvider>
                    <SWRConfig value={{
                        revalidateOnFocus: true,
                        revalidateOnReconnect: true,
                        refreshInterval: 0,
                        dedupingInterval: 2000
                    }}>
                        <main className="min-h-screen pb-20">
                            {children}
                        </main>
                        <BottomNav />
                        <ToastContainer />
                    </SWRConfig>
                </ThemeProvider>
            </body>
        </html>
    );
}

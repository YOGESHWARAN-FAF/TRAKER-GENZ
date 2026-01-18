import { Providers } from "@/components/Providers";
import "./globals.css";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata = {
    title: "Tasker Gen-Z",
    description: "Daily Grind Tracker",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${outfit.className} bg-[#0a0a0f] text-white`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ConfirmationProvider } from "@/context/ConfirmationContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
 title: "Meditaj | Healthcare Management",
 description: "Advanced minimalist medical platform for high-fidelity healthcare.",
};

export default function RootLayout({ children }) {
 return (
 <html lang="en" suppressHydrationWarning>
 <body className={`${inter.variable} font-sans antialiased text-med-text`} suppressHydrationWarning>
 <AuthProvider>
 <LanguageProvider>
 <CartProvider>
 <ConfirmationProvider>
 {children}
 <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
 </ConfirmationProvider>
 </CartProvider>
 </LanguageProvider>
 </AuthProvider>
 </body>
 </html>
 );
}

import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { ConfirmationProvider } from "@/context/ConfirmationContext";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Meditaj | Modern Healthcare Precision",
  description: "Synchronizing expert clinical specialization with a fluid, patient-first diagnostic interface.",
};


import NavigationWrapper from "@/components/Home/NavigationWrapper";
import FooterWrapper from "@/components/Home/FooterWrapper";
import MotionProvider from "@/components/UI/MotionProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased text-med-text overflow-x-hidden`} suppressHydrationWarning>
        <AuthProvider>
          <CartProvider>
            <ConfirmationProvider>
              <MotionProvider>
                <NavigationWrapper />
                <main>{children}</main>
                <FooterWrapper />
              </MotionProvider>
              <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
            </ConfirmationProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

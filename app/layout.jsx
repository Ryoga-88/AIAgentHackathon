import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { PlanDataProvider } from "../contexts/PlanDataContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "旅行 AI プランナー",
  description: "AIがあなたの理想の旅をプランニング。パーソナライズされた旅程を提案します。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <PlanDataProvider>
            {children}
          </PlanDataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

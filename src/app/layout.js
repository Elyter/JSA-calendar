import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";
import 'react-big-calendar/lib/css/react-big-calendar.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "JSA Calendar",
  description: "Système de réservation de terrains",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <nav className="bg-blue-500 p-4">
          <ul className="flex space-x-4 justify-center">
            <li>
              <Link href="/" className="text-white hover:underline">Accueil</Link>
            </li>
            <li>
              <Link href="/admin" className="text-white hover:underline">Administration</Link>
            </li>
          </ul>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}

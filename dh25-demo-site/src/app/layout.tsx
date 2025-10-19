import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TechVault - Premium Tech Store',
  description: 'Shop the latest tech innovations at unbeatable prices',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}

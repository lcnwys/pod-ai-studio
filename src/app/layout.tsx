import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/lib/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '创次元 POD AI Studio',
  description: 'AI-powered design production platform for POD sellers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={`${inter.className} bg-[#0a0c14] text-gray-200 antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CaturKita – Main Catur Online',
  description:
    'Aplikasi catur online gratis. Main melawan komputer dengan 3 level kesulitan, atau tantang temanmu secara realtime. Tanpa install, langsung dari browser.',
  keywords: ['catur', 'chess', 'online', 'komputer', 'teman', 'game'],
  openGraph: {
    title: 'CaturKita – Main Catur Online',
    description: 'Tantang komputer atau temanmu dalam permainan catur realtime!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

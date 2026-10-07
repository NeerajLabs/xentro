import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'XENTRO — Connect People. Create Opportunity.',
  description: 'Xentro connects startups, mentors, investors and institutions to build a stronger, more inclusive entrepreneurial ecosystem.',
  icons: {
    icon: '/xentro-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('xentro_theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'dark' || (!saved && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F7F8F6] text-[#101212] dark:bg-[#0D0F0F] dark:text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

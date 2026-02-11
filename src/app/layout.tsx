import React from 'react';
import type { Metadata } from 'next';
import ThemeRegistry from '../theme/Registry';

export const metadata: Metadata = {
  title: 'LCP Web App Admin',
  description: 'Workforce Management and Learning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
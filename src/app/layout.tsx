import './globals.css';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { ThemeProvider } from '@/shared/ThemeContext';

export const metadata = {
  title: 'CoSpace - Coworking System',
  description: 'Sistema de reserva de espacios de trabajo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="light">
      <body className="antialiased">
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

import './globals.css';
import { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Bunn Studios | Gestão de Atendimentos',
  description: 'Sistema completo de rastreamento de atendimentos, controle de prazos, custos e faturamento para a Bunn Studios.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <div className="app-container">
            <Navbar />
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

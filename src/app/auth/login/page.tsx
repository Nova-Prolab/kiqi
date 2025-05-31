
import LoginForm from '@/components/auth/LoginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - NovaNexus',
  description: 'Accede a tu panel de administración de novelas.',
};

export default function LoginPage() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <LoginForm />
      </div>
    </section>
  );
}

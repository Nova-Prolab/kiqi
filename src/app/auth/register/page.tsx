
import RegisterForm from '@/components/auth/RegisterForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta - NovaNexus',
  description: 'Regístrate para empezar a gestionar tus novelas.',
};

export default function RegisterPage() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <RegisterForm />
      </div>
    </section>
  );
}

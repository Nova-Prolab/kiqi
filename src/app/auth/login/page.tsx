
import LoginForm from '@/components/auth/LoginForm';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Iniciar Sesión - Kiqi!',
  description: 'Accede a tu panel de administración de novelas.',
};

function LoginFormFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
      <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
      <p className="text-muted-foreground">Cargando formulario de inicio de sesión...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}

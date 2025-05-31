
'use client';

import CreateNovelForm from '@/components/admin/CreateNovelForm';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function CreateNovelPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/auth/login?redirect=/admin/create-novel');
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center min-h-[calc(100vh-20rem)]">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg text-muted-foreground">Verificando sesión...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <title>Crear Nueva Novela - NovaNexus</title>
      <div className="container mx-auto px-4">
        <CreateNovelForm />
      </div>
    </section>
  );
}

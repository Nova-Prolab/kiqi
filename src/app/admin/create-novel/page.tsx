
'use client'; // Mark as client component for auth check

import CreateNovelForm from '@/components/admin/CreateNovelForm';
import type { Metadata } from 'next';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Metadata can still be defined, but it's static for this page.
// export const metadata: Metadata = { 
// We'll handle title in the client component or keep it simple
// title: 'Crear Nueva Novela - Literary Nexus',
// description: 'Añade una nueva novela al catálogo.',
// };

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
        <div className="container mx-auto px-4 text-center">
          <p>Cargando...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <title>Crear Nueva Novela - Literary Nexus</title> {/* Set title here or in CreateNovelForm */}
      <div className="container mx-auto px-4">
        <CreateNovelForm />
      </div>
    </section>
  );
}

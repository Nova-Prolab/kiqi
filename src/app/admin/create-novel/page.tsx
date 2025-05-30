
import CreateNovelForm from '@/components/admin/CreateNovelForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Nueva Novela - Literary Nexus',
  description: 'Añade una nueva novela al catálogo.',
};

export default function CreateNovelPage() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <CreateNovelForm />
      </div>
    </section>
  );
}

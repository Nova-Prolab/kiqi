
import { fetchNovelById } from '@/lib/github';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import AddChapterPageClient from './AddChapterPageClient'; // Nuevo componente cliente

// La generación de metadata puede seguir siendo async si es necesario
export async function generateMetadata({ params }: { params: { novelId: string } }): Promise<Metadata> {
  // Aquí fetchNovelById se ejecuta en el servidor, donde tiene acceso a las variables de entorno
  const novel = await fetchNovelById(params.novelId);
  if (!novel) {
    return {
      title: 'Novela no encontrada - Literary Nexus',
    };
  }
  return {
    title: `Gestionar Capítulos: ${novel.title} - Literary Nexus`,
    description: `Añade o edita capítulos para ${novel.title}.`,
  };
}

// Esta página ahora es un Server Component async
export default async function AddChapterToNovelPage({ params }: { params: { novelId: string } }) {
  const { novelId } = params;

  if (!novelId) {
    notFound(); // Si no hay novelId, no se puede continuar
  }

  // fetchNovelById se ejecuta en el servidor
  const novel = await fetchNovelById(novelId);

  if (!novel) {
    // Si fetchNovelById devuelve undefined (por no encontrar la novela o por error de env vars en el servidor),
    // se llama a notFound(). El error de env vars se logueará en la consola del servidor.
    notFound();
  }

  // Pasamos la novela obtenida al componente cliente
  return <AddChapterPageClient novel={novel} />;
}

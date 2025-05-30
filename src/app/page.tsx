import { fetchNovels } from '@/lib/github';
import NovelCard from '@/components/novel/NovelCard';
import type { Novel } from '@/lib/types';

export default async function HomePage() {
  const novels: Novel[] = await fetchNovels();

  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">Welcome to Literary Nexus</h1>
        <p className="mt-4 text-lg text-foreground/80 sm:text-xl">
          Discover captivating novels and immerse yourself in extraordinary worlds.
        </p>
      </section>

      {novels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {novels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-xl text-muted-foreground">No novels available at the moment. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

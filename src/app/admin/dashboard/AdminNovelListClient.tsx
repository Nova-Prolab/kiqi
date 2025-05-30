
'use client';

import type { Novel } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Trash2, Eye, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { useOwnedNovels } from '@/hooks/useOwnedNovels';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteNovelAction } from '@/actions/novelAdminActions';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from 'react';

interface AdminNovelListClientProps {
  novels: Novel[]; // Todas las novelas fetcheadas del repo
}

const initialDeleteState = {
  message: '',
  success: false,
  deletedNovelId: undefined as string | undefined,
};

function DeleteButtonContent() {
    const { pending } = useFormStatus();
    return (
        <>
            {pending ? (
                <>
                    <Trash2 className="mr-2 h-4 w-4 animate-pulse" /> Eliminando...
                </>
            ) : (
                <>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </>
            )}
        </>
    );
}


export default function AdminNovelListClient({ novels: allFetchedNovels }: AdminNovelListClientProps) {
  const { ownedNovelIds, removeOwnedNovel, isMounted } = useOwnedNovels();
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(deleteNovelAction, initialDeleteState);
  const { toast } = useToast();
  
  // Este estado local contendrá solo las novelas que el usuario "posee" en este navegador
  const [ownedNovelsToDisplay, setOwnedNovelsToDisplay] = useState<Novel[]>([]);

  useEffect(() => {
    if (isMounted) {
      // Filtrar las novelas para mostrar solo las que están en ownedNovelIds
      const filtered = allFetchedNovels.filter(novel => ownedNovelIds.includes(novel.id));
      setOwnedNovelsToDisplay(filtered);
    }
  }, [isMounted, allFetchedNovels, ownedNovelIds]);


  useEffect(() => {
    if (deleteState?.message && !isDeletePending) { // Asegurarse que la acción no esté pendiente
      toast({
        title: deleteState.success ? 'Novela Eliminada (Info)' : 'Error al Eliminar',
        description: deleteState.message,
        variant: deleteState.success ? 'default' : 'destructive',
      });
      if (deleteState.success && deleteState.deletedNovelId) {
        // removeOwnedNovel actualizará ownedNovelIds, lo que disparará el useEffect anterior
        // para re-filtrar y actualizar ownedNovelsToDisplay.
        removeOwnedNovel(deleteState.deletedNovelId);
      }
    }
  }, [deleteState, toast, removeOwnedNovel, isDeletePending]);
  
  if (!isMounted) {
    // Esqueleto de carga mientras se determina la propiedad
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex-row gap-4 items-start">
                <div className="relative w-20 h-28 bg-muted rounded shrink-0"></div>
                <div className="flex-grow space-y-2">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
            </CardHeader>
            <CardContent><div className="h-4 bg-muted rounded w-1/3 mb-2"></div></CardContent>
            <CardFooter><div className="h-10 bg-muted rounded w-full"></div></CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (ownedNovelsToDisplay.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">
          No has creado ninguna novela en este navegador o no se encontraron novelas gestionadas.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes <Link href="/admin/create-novel" className="text-primary hover:underline">crear una nueva novela</Link> para empezar a gestionarla aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ownedNovelsToDisplay.map((novel) => {
        // Asegurarse de que novel.infoJsonSha exista y no sea undefined.
        // fetchNovels ya debería proveer esto. Si no, algo está mal en la carga de datos.
        const infoSha = novel.infoJsonSha;
        if (!infoSha) {
          console.warn(`La novela ${novel.id} no tiene infoJsonSha. No se podrá eliminar.`);
        }

        return (
          <Card key={novel.id} className="flex flex-col border-primary/30">
            <CardHeader className="flex-row gap-4 items-start">
              <div className="relative w-20 h-28 aspect-[2/3] rounded overflow-hidden shrink-0 bg-muted">
                {novel.coverImage && novel.coverImage !== 'https://placehold.co/300x450.png?text=No+Cover' ? (
                    <Image
                        src={novel.coverImage}
                        alt={`Portada de ${novel.title}`}
                        fill
                        sizes="(max-width: 768px) 20vw, 10vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">Sin portada</div>
                )}
              </div>
              <div className="flex-grow">
                <CardTitle className="text-lg line-clamp-3 leading-tight">{novel.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">{novel.author}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-xs text-muted-foreground">
                    Capítulos: {novel.chapters?.length || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                    ID: {novel.id}
                </p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row items-center gap-2 pt-4">
              <Button asChild variant="outline" className="w-full sm:w-auto text-xs">
                <Link href={`/novels/${novel.id}`}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Novela
                </Link>
              </Button>
              <> {/* Estos botones solo se muestran para novelas "poseídas" (ya filtradas) */}
                <Button asChild variant="secondary" className="w-full sm:w-auto text-xs">
                  <Link href={`/admin/novels/${novel.id}/add-chapter`}>
                    <ListChecks className="mr-1.5 h-3.5 w-3.5" /> Gestionar Capítulos
                  </Link>
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto text-xs" disabled={!infoSha || isDeletePending}>
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                          <AlertTriangle className="text-destructive mr-2"/>Confirmar Eliminación
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que quieres eliminar la información de la novela (<code>info.json</code>) para "{novel.title}"?
                        Esto la hará inaccesible desde la aplicación y la eliminará de tu lista de novelas gestionadas en este navegador.
                        <br />
                        <strong className="text-destructive-foreground">Los archivos de capítulo NO se eliminarán del repositorio y deberán gestionarse manualmente si deseas eliminarlos por completo.</strong>
                        <br />Esta acción no se puede deshacer desde la web.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <form action={deleteFormAction} className="inline-flex">
                          <input type="hidden" name="novelId" value={novel.id} />
                          <input type="hidden" name="infoJsonSha" value={infoSha || ''} /> {/* Usar infoSha verificado */}
                          <Button type="submit" variant="destructive" disabled={isDeletePending}>
                             <DeleteButtonContent/>
                          </Button>
                      </form>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
    

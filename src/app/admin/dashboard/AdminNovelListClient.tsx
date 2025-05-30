
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
import { useEffect, useState } from 'react';

interface AdminNovelListClientProps {
  novels: Novel[];
}

const initialDeleteState = {
  message: '',
  success: false,
  deletedNovelId: undefined,
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


export default function AdminNovelListClient({ novels: initialNovels }: AdminNovelListClientProps) {
  const { isNovelOwned, removeOwnedNovel, isMounted } = useOwnedNovels();
  const [deleteState, deleteFormAction] = useActionState(deleteNovelAction, initialDeleteState);
  const { toast } = useToast();
  const [currentNovels, setCurrentNovels] = useState<Novel[]>(initialNovels);

  useEffect(() => {
    if (deleteState?.message) {
      toast({
        title: deleteState.success ? 'Novela Eliminada (Info)' : 'Error al Eliminar',
        description: deleteState.message,
        variant: deleteState.success ? 'default' : 'destructive',
      });
      if (deleteState.success && deleteState.deletedNovelId) {
        removeOwnedNovel(deleteState.deletedNovelId);
        setCurrentNovels(prev => prev.filter(n => n.id !== deleteState.deletedNovelId));
      }
    }
  }, [deleteState, toast, removeOwnedNovel]);
  
  // Update currentNovels if initialNovels changes (e.g., after revalidation)
  useEffect(() => {
    setCurrentNovels(initialNovels);
  }, [initialNovels]);


  if (!isMounted) {
    // Optional: Render a loading skeleton or null while waiting for isMounted
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader><div className="h-6 bg-muted rounded w-3/4"></div></CardHeader>
            <CardContent><div className="h-4 bg-muted rounded w-1/2 mb-2"></div></CardContent>
            <CardFooter><div className="h-10 bg-muted rounded w-full"></div></CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (currentNovels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-muted-foreground">
          No se encontraron novelas. ¡Empieza creando una!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {currentNovels.map((novel) => {
        const owned = isNovelOwned(novel.id);
        return (
          <Card key={novel.id} className={`flex flex-col ${owned ? 'border-primary/30' : 'opacity-75'}`}>
            <CardHeader className="flex-row gap-4 items-start">
              <div className="relative w-20 h-28 aspect-[2/3] rounded overflow-hidden shrink-0">
                <Image
                    src={novel.coverImage}
                    alt={`Portada de ${novel.title}`}
                    fill
                    sizes="(max-width: 768px) 20vw, 10vw"
                    className="object-cover"
                />
              </div>
              <div className="flex-grow">
                <CardTitle className="text-lg line-clamp-3 leading-tight">{novel.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">{novel.author}</CardDescription>
                {!owned && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">No gestionada en este navegador</p>}
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
              {owned && (
                <>
                  <Button asChild variant="secondary" className="w-full sm:w-auto text-xs">
                    <Link href={`/admin/novels/${novel.id}/add-chapter`}>
                      <ListChecks className="mr-1.5 h-3.5 w-3.5" /> Gestionar Capítulos
                    </Link>
                  </Button>
                   <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto text-xs">
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
                          Esto la hará inaccesible desde la aplicación.
                          <br />
                          <strong className="text-destructive-foreground">Los archivos de capítulo NO se eliminarán del repositorio y deberán gestionarse manualmente en GitHub si deseas eliminarlos por completo.</strong>
                          <br /> Esta acción no se puede deshacer desde la web.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <form action={deleteFormAction} className="inline-flex">
                            <input type="hidden" name="novelId" value={novel.id} />
                            <input type="hidden" name="infoJsonSha" value={novel.infoJsonSha || ''} />
                            <Button type="submit" variant="destructive">
                               <DeleteButtonContent/>
                            </Button>
                        </form>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}

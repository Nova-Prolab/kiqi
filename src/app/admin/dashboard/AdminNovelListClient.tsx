
'use client';

import type { Novel } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ListChecks, Trash2, Eye, AlertTriangle, UserCircle, ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
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
import { useActionState, useTransition, useEffect, useState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { deleteNovelAction } from '@/actions/novelAdminActions';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';


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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...
                </>
            ) : (
                <>
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </>
            )}
        </>
    );
}

interface AdminNovelListClientProps {
  novels: Novel[];
}

export default function AdminNovelListClient({ novels: allFetchedNovels }: AdminNovelListClientProps) {
  const { currentUser, isLoading: authIsLoading } = useAuth();
  const router = useRouter();
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(deleteNovelAction, initialDeleteState);
  const { toast } = useToast();
  const [isPendingFormReset, startFormResetTransition] = useTransition();

  const [clientNovels, setClientNovels] = useState<Novel[]>(allFetchedNovels);

  useEffect(() => {
    setClientNovels(allFetchedNovels);
  }, [allFetchedNovels]);

  useEffect(() => {
    if (!authIsLoading && !currentUser) {
      router.push('/auth/login?redirect=/admin/dashboard');
    }
  }, [currentUser, authIsLoading, router]);

  useEffect(() => {
    if (deleteState?.message && !isDeletePending && !isPendingFormReset) {
      toast({
        title: deleteState.success ? 'Novela Eliminada' : 'Error al Eliminar',
        description: deleteState.message,
        variant: deleteState.success ? 'default' : 'destructive',
      });
      if (deleteState.success && deleteState.deletedNovelId) {
        startFormResetTransition(() => {
          setClientNovels(prevNovels => prevNovels.filter(n => n.id !== deleteState.deletedNovelId));
        });
      }
    }
  }, [deleteState, toast, isDeletePending, isPendingFormReset]);

  const managedNovels = useMemo(() => {
    if (!currentUser) return [];
    return clientNovels.filter(novel => novel.creatorId === currentUser.id);
  }, [clientNovels, currentUser]);


  if (authIsLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg text-muted-foreground">Cargando panel de administración...</p>
      </div>
    );
  }

  const renderNovelCard = (novel: Novel) => {
    const infoSha = novel.infoJsonSha;
    if (!infoSha) {
      console.warn(`La novela gestionada ${novel.id} no tiene infoJsonSha. No se podrá eliminar.`);
    }
    return (
      <Card key={novel.id} className="flex flex-col border-primary/50 shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
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
                <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-muted/50">Sin portada</div>
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
            <Badge variant="default" className="mt-2 text-xs"><UserCircle className="mr-1 h-3 w-3" />Gestionada por ti</Badge>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center gap-2 pt-4">
          <Button asChild variant="outline" className="w-full sm:w-auto text-xs">
            <Link href={`/novels/${novel.id}`}>
              <Eye className="mr-1.5 h-3.5 w-3.5" /> Ver Novela
            </Link>
          </Button>
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
                  ¿Estás seguro de que quieres eliminar la novela "{novel.title}"? <br /> Esta acción es irreversible
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <form action={deleteFormAction} className="inline-flex">
                    <input type="hidden" name="novelId" value={novel.id} />
                    <input type="hidden" name="infoJsonSha" value={infoSha || ''} />
                    <Button type="submit" variant="destructive" disabled={isDeletePending}>
                        <DeleteButtonContent/>
                    </Button>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      </Card>
    );
  };

  if (managedNovels.length === 0) {
      return (
          <div className="text-center py-12 border-2 border-dashed border-muted-foreground/30 rounded-lg mt-8">
            <UserCircle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">No estás gestionando ninguna novela</h2>
            <p className="mt-1 text-muted-foreground">
                Puedes <Link href="/admin/create-novel" className="text-primary hover:underline font-medium">crear una nueva novela</Link> para empezar a gestionarla aquí.
            </p>
          </div>
      )
  }

  return (
    <div className="space-y-8 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managedNovels.map(novel => renderNovelCard(novel))}
      </div>
    </div>
  );
}

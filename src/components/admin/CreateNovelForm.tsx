
'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createNovelAction } from '@/actions/novelAdminActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, BookPlus } from 'lucide-react';
import ManageNovelChapters from './ManageNovelChapters';
import { useOwnedNovels } from '@/hooks/useOwnedNovels'; // Import the new hook

const initialNovelState = {
  message: '',
  success: false,
  novelId: undefined,
  novelTitle: undefined,
};

function SubmitNovelButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Creando Novela...' : 'Crear Archivo de Información'}
    </Button>
  );
}

export default function CreateNovelForm() {
  const [novelState, formAction] = useActionState(createNovelAction, initialNovelState);
  const { toast } = useToast();
  const { addOwnedNovel } = useOwnedNovels(); // Use the hook

  useEffect(() => {
    if (novelState?.message) {
      if (novelState.message.startsWith('Novela') || novelState.message.startsWith('Error al crear la novela') || novelState.message.startsWith('Error de validación:')) {
        toast({
          title: novelState.success ? 'Éxito en Creación de Información' : 'Error en Creación de Información',
          description: novelState.message,
          variant: novelState.success ? 'default' : 'destructive',
        });
      }
      if (novelState.success && novelState.novelId) {
        addOwnedNovel(novelState.novelId); // Add to localStorage on success
      }
    }
  }, [novelState, toast, addOwnedNovel]);

  return (
    <div className="max-w-2xl mx-auto">
       <Button variant="outline" asChild className="mb-6">
          <Link href="/admin/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-2xl">
            <BookPlus className="mr-3 h-6 w-6 text-primary" />
            Crear Nueva Novela (Información Básica)
          </CardTitle>
          <CardDescription>
            Completa los detalles para añadir una nueva novela.
            Esto creará el archivo de información de la novela. Después podrás añadir capítulos.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Novela</Label>
              <Input id="title" name="title" placeholder="Ej: El Viaje Interminable" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor</Label>
              <Input id="author" name="author" placeholder="Ej: Nombre del Autor" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Escribe una breve sinopsis de la novela. Los saltos de línea se conservarán."
                rows={6}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">URL de Portada (Imgur u otro)</Label>
                <Input id="coverImageUrl" name="coverImageUrl" type="url" placeholder="Ej: https://i.imgur.com/xxxxxxx.png" />
                 <p className="text-xs text-muted-foreground">Pega la URL directa de la imagen (ej: .png, .jpg).</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Input id="category" name="category" placeholder="Ej: Fantasía Épica" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="tags">Etiquetas (separadas por comas)</Label>
                <Input id="tags" name="tags" placeholder="Ej: magia, aventura, dragones (la etiqueta 'destacado' será ignorada)" />
                 <p className="text-xs text-muted-foreground">La etiqueta 'destacado' no se puede añadir desde aquí.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="translator">Traductor (si aplica)</Label>
                <Input id="translator" name="translator" placeholder="Ej: Grupo de Traducción" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="releaseDate">Fecha de Lanzamiento (Opcional)</Label>
              <Input id="releaseDate" name="releaseDate" type="date" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start sm:flex-row sm:justify-end gap-4 pt-6">
            <SubmitNovelButton />
          </CardFooter>
        </form>
      </Card>

      {novelState?.message && novelState.success && novelState.novelId && novelState.novelTitle && (
        <Card className="mt-6 bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700">
          <CardHeader>
            <CardTitle className="flex items-center text-green-700 dark:text-green-300">
              <CheckCircle className="mr-2 h-5 w-5" />
              ¡Información de Novela Creada!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-600 dark:text-green-400 space-y-2">
            <p>{novelState.message}</p>
            <p>
              Ahora puedes <Link href={`/novels/${novelState.novelId}`} className="underline hover:text-primary">ver la página de la novela</Link> o añadir capítulos a continuación.
            </p>
             <p className="text-xs text-muted-foreground">Recuerda: La novela ha sido marcada como "tuya" en este navegador. Solo tú verás opciones de gestión adicionales para ella en el panel.</p>
          </CardContent>
        </Card>
      )}
      {novelState?.message && !novelState.success && (
         <Card className="mt-6 bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-700">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700 dark:text-red-400">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Error al Crear Información de Novela
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-red-600 dark:text-red-500">
            <p>{novelState.message}</p>
          </CardContent>
        </Card>
      )}

      {novelState?.success && novelState.novelId && novelState.novelTitle && (
        // Redirect to the manage chapters page or display ManageNovelChapters component directly
         <div className="mt-8">
            <Button asChild variant="secondary">
                <Link href={`/admin/novels/${novelState.novelId}/add-chapter`}>
                    Ir a Gestionar Capítulos para {novelState.novelTitle}
                </Link>
            </Button>
        </div>
        // <ManageNovelChapters novelId={novelState.novelId} novelTitle={novelState.novelTitle} />
      )}
    </div>
  );
}

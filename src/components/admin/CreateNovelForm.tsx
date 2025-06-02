
'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { createNovelAction } from '@/actions/novelAdminActions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, AlertTriangle, BookPlus, Star, TrendingUp } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { AgeRating, NovelStatus } from '@/lib/types';
import { AGE_RATING_VALUES, STATUS_VALUES } from '@/lib/types';

const initialNovelState = {
  message: '',
  success: false,
  novelId: undefined as string | undefined,
  novelTitle: undefined as string | undefined,
};

function SubmitNovelButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Creando Información...' : 'Crear Información de Novela'}
    </Button>
  );
}

const ageRatingLabels: Record<AgeRating, string> = {
  all: 'Todos (Todas las edades)',
  pg: '+10 (Supervisión parental sugerida)',
  teen: '+13 (Adolescentes)',
  mature: '+17 (Maduro)',
  adults: '+18 (Adultos)',
};

const platformRatingOptions: { value: string, label: string }[] = [
  { value: '0', label: '0 Estrellas (Sin Calificar)' },
  { value: '1', label: '1 Estrella' },
  { value: '2', label: '2 Estrellas' },
  { value: '3', label: '3 Estrellas' },
  { value: '4', label: '4 Estrellas' },
  { value: '5', label: '5 Estrellas (Excelente)' },
];

const novelStatusLabels: Record<NovelStatus, string> = {
  ongoing: 'En curso',
  completed: 'Completada',
  hiatus: 'En Hiato',
  dropped: 'Abandonada',
};


export default function CreateNovelForm() {
  const [novelState, formAction, isPending] = useActionState(createNovelAction, initialNovelState);
  const { toast } = useToast();
  const { currentUser } = useAuth(); // isLoading from useAuth is handled by parent page
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedAgeRating, setSelectedAgeRating] = useState<AgeRating | ''>('');
  const [selectedPlatformRating, setSelectedPlatformRating] = useState<string>('0');
  const [selectedStatus, setSelectedStatus] = useState<NovelStatus | ''>('');


  useEffect(() => {
    if (novelState?.message && !isPending) {
      toast({
        title: novelState.success ? 'Éxito en Creación de Información' : 'Error en Creación de Información',
        description: novelState.message,
        variant: novelState.success ? 'default' : 'destructive',
      });
      if (novelState.success) {
        formRef.current?.reset();
        setSelectedAgeRating(''); 
        setSelectedPlatformRating('0');
        setSelectedStatus('');
      }
    }
  }, [novelState, toast, isPending]);

  if (!currentUser) {
    // This check is a fallback, parent page should handle redirection ideally
    return <div className="flex justify-center items-center h-64"><p>Debes iniciar sesión para crear una novela.</p></div>;
  }

  const EMPTY_STATUS_VALUE = "__EMPTY_STATUS__";

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
            Esto creará el archivo de información de la novela. Después podrás gestionar sus capítulos desde el panel de administración.
          </CardDescription>
        </CardHeader>
        <form action={formAction} ref={formRef}>
          <input type="hidden" name="creatorId" value={currentUser.id} />
          <input type="hidden" name="ageRating" value={selectedAgeRating} />
          <input type="hidden" name="rating_platform" value={selectedPlatformRating} />
          <input type="hidden" name="status" value={selectedStatus} />

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título de la Novela <span className="text-destructive">*</span></Label>
              <Input id="title" name="title" placeholder="Ej: El Viaje Interminable" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Autor <span className="text-destructive">*</span></Label>
              <Input id="author" name="author" placeholder="Ej: Nombre del Autor" required />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ageRating">Clasificación de Edad <span className="text-destructive">*</span></Label>
                <Select 
                  name="ageRatingSelect" /* Name on Select for UI, actual value via hidden input */
                  onValueChange={(value) => setSelectedAgeRating(value as AgeRating)}
                  value={selectedAgeRating}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona una clasificación de edad" />
                  </SelectTrigger>
                  <SelectContent>
                    {AGE_RATING_VALUES.map(rating => (
                      <SelectItem key={rating} value={rating}>
                        {ageRatingLabels[rating]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="platformRating">Calificación de la Plataforma (Opcional)</Label>
                <Select
                  name="platformRatingSelect"
                  onValueChange={(value) => setSelectedPlatformRating(value)}
                  value={selectedPlatformRating}
                >
                  <SelectTrigger className="w-full">
                     <SelectValue placeholder="Selecciona una calificación" />
                  </SelectTrigger>
                  <SelectContent>
                    {platformRatingOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>


            <div className="space-y-2">
              <Label htmlFor="description">Descripción <span className="text-destructive">*</span></Label>
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
                <Input id="tags" name="tags" placeholder="Ej: magia, aventura, dragones" />
                 <p className="text-xs text-muted-foreground">La etiqueta 'destacado' será ignorada si se añade aquí.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="translator">Traductor (si aplica)</Label>
                <Input id="translator" name="translator" placeholder="Ej: Grupo de Traducción" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="releaseDate">Fecha de Lanzamiento (Opcional)</Label>
                <Input id="releaseDate" name="releaseDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado de la Novela (Opcional)</Label>
                <Select
                  name="statusSelect"
                  onValueChange={(value) => {
                    if (value === EMPTY_STATUS_VALUE) {
                      setSelectedStatus('');
                    } else {
                      setSelectedStatus(value as NovelStatus);
                    }
                  }}
                  value={selectedStatus} 
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EMPTY_STATUS_VALUE}>(Sin especificar)</SelectItem>
                    {STATUS_VALUES.map(statusVal => (
                      <SelectItem key={statusVal} value={statusVal}>
                        {novelStatusLabels[statusVal]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
             <p className="text-xs text-muted-foreground"><span className="text-destructive">*</span> Campos obligatorios</p>
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
              Puedes{' '}
              <Link href={`/admin/novels/${novelState.novelId}/add-chapter`} className="underline hover:text-primary font-medium">
                ir a gestionar sus capítulos
              </Link>
              {' '}o volver al{' '}
              <Link href="/admin/dashboard" className="underline hover:text-primary font-medium">
                panel de administración
              </Link>.
            </p>
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
    </div>
  );
}


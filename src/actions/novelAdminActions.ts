
'use server';

import { z } from 'zod';
import { createFileInRepo, deleteFileInRepo, getFileSha } from '@/lib/github';
import type { InfoJson, CreateNovelInput } from '@/lib/types';
import { revalidatePath } from 'next/cache';

const createNovelSchema = z.object({
  title: z.string().min(1, "El título es obligatorio."),
  author: z.string().min(1, "El autor es obligatorio."),
  description: z.string().min(1, "La descripción es obligatoria."),
  coverImageUrl: z.string().url("URL de portada inválida.").optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.string().optional(), // Comma-separated
  translator: z.string().optional(),
  releaseDate: z.string().optional(), // Expects YYYY-MM-DD format if provided
});

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-'); // Replace multiple - with single -
}

export async function createNovelAction(
  prevState: { message: string; success: boolean; novelId?: string, novelTitle?: string } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; novelId?: string, novelTitle?: string }> {
  
  const rawFormData: CreateNovelInput = {
    title: formData.get('title') as string,
    author: formData.get('author') as string,
    description: formData.get('description') as string,
    coverImageUrl: formData.get('coverImageUrl') as string | undefined,
    category: formData.get('category') as string | undefined,
    tags: formData.get('tags') as string | undefined,
    translator: formData.get('translator') as string | undefined,
    releaseDate: formData.get('releaseDate') as string | undefined,
  };

  const validatedFields = createNovelSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { data } = validatedFields;
  const novelId = slugify(data.title);

  if (!novelId) {
    return { message: "No se pudo generar un ID para la novela a partir del título.", success: false };
  }

  // Filtrar la etiqueta "destacado"
  const tagsArray = data.tags 
    ? data.tags.split(',')
        .map(tag => tag.trim())
        .filter(tag => tag && tag.toLowerCase() !== 'destacado') // Filtrar "destacado"
    : undefined;

  const infoJson: InfoJson = {
    titulo: data.title,
    autor: data.author,
    // Asegurarse de que los saltos de línea literales de un textarea se escapen para JSON
    descripcion: data.description.replace(/\r\n|\r|\n/g, '\\n'),
    coverImageUrl: data.coverImageUrl || undefined,
    categoria: data.category || undefined,
    etiquetas: tagsArray,
    traductor: data.translator || undefined,
    fecha_lanzamiento: data.releaseDate || undefined,
  };

  const infoJsonContent = JSON.stringify(infoJson, null, 2);
  const filePath = `${novelId}/info.json`;
  const commitMessage = `feat: Add new novel - ${data.title}`;

  try {
    await createFileInRepo(filePath, infoJsonContent, commitMessage);
    
    // Revalidar rutas relevantes
    revalidatePath('/'); // Revalida la página de inicio donde se listan las novelas
    revalidatePath('/admin/dashboard'); // Revalida el dashboard de administración
    revalidatePath(`/novels/${novelId}`); // Revalida la página de detalles de la nueva novela

    return { 
      message: `Información de la novela '${data.title}' creada con éxito con ID '${novelId}'. Ahora puedes añadir capítulos.`, 
      success: true, 
      novelId,
      novelTitle: data.title // Devolver el título para usarlo en el cliente
    };
  } catch (error) {
    console.error("Error creating novel info.json:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al crear el archivo de información de la novela.";
    // Comprobar si el error es porque el archivo ya existe (código 422 de GitHub)
    if (errorMessage.includes('422') || (error && typeof error === 'object' && 'status' in error && error.status === 422)) {
      return {
        message: `Error al crear la información de la novela: Ya existe una novela con el ID '${novelId}'. El título debe ser único.`,
        success: false,
      };
    }
    return {
      message: `Error al crear la información de la novela: ${errorMessage}`,
      success: false,
    };
  }
}


const saveChapterSchema = z.object({
  novelId: z.string().min(1, "El ID de la novela es obligatorio."),
  chapterNumber: z.coerce.number().int().positive("El número de capítulo debe ser un entero positivo."),
  chapterTitle: z.string().optional(),
  chapterContent: z.string().min(1, "El contenido del capítulo no puede estar vacío."),
});

interface SaveChapterState {
  message: string;
  success: boolean;
  chapterPath?: string;
}

export async function saveChapterAction(
  prevState: SaveChapterState | null,
  formData: FormData
): Promise<SaveChapterState> {
  const rawFormData = {
    novelId: formData.get('novelId') as string,
    chapterNumber: formData.get('chapterNumber') as string, 
    chapterTitle: formData.get('chapterTitle') as string | undefined,
    chapterContent: formData.get('chapterContent') as string,
  };

  const validatedFields = saveChapterSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(fieldErrors).flat().join(' ');
    console.error("Chapter validation errors:", fieldErrors);
    return {
      message: `Error de validación: ${errorMessages}`,
      success: false,
    };
  }

  const { novelId, chapterNumber, chapterTitle, chapterContent } = validatedFields.data;
  
  // Comprobar si el contenido del capítulo (después de quitar HTML básico de un editor vacío) está realmente vacío
  const tempDiv = typeof document !== 'undefined' ? document.createElement('div') : null;
  let textContentForCheck = chapterContent;
  if (tempDiv) {
      tempDiv.innerHTML = chapterContent;
      textContentForCheck = tempDiv.textContent || tempDiv.innerText || "";
  } else {
      // Fallback simple si document no está disponible (debería estarlo en server actions via JSDOM o similar si es necesario)
      // o simplemente confiar en que la validación min(1) del schema es suficiente
      textContentForCheck = chapterContent.replace(/<[^>]*>/g, '').trim();
  }

  if (!textContentForCheck.trim()) {
    return {
        message: "El contenido del capítulo está vacío o solo contiene HTML sin texto.",
        success: false,
    }
  }

  let finalHtmlContent = chapterContent; // Asumimos que chapterContent ya es HTML del editor

  // Si se proporciona un título de capítulo, lo añadimos como H1 al principio,
  // a menos que el contenido ya comience con un H1 (para evitar duplicados si el editor lo añade)
  if (chapterTitle && chapterTitle.trim() !== '') {
    const trimmedContent = finalHtmlContent.trim();
    if (!trimmedContent.toLowerCase().startsWith('<h1')) {
      finalHtmlContent = `<h1>${chapterTitle.trim()}</h1>\n${finalHtmlContent}`;
    }
  }

  const chapterFilename = `chapter-${chapterNumber}.html`;
  const filePathInRepo = `${novelId}/${chapterFilename}`;
  const commitMessage = `feat: Add/Update chapter ${chapterNumber} for ${novelId}`;

  try {
    // Para actualizar un archivo existente, GitHub necesita el SHA del archivo actual.
    const existingFileSha = await getFileSha(filePathInRepo);
    await createFileInRepo(filePathInRepo, finalHtmlContent, commitMessage, existingFileSha || undefined);

    // Revalidar la página de detalles de la novela y la página del capítulo específico
    revalidatePath(`/novels/${novelId}`);
    revalidatePath(`/novels/${novelId}/chapters/chapter-${chapterNumber}`); // Asume que el ID del capítulo es chapter-N

    return {
      message: `Capítulo ${chapterNumber} ${existingFileSha ? 'actualizado' : 'guardado'} con éxito para la novela '${novelId}'.`,
      success: true,
      chapterPath: `/novels/${novelId}/chapters/chapter-${chapterNumber}`,
    };
  } catch (error) {
    console.error(`[ChapterSaveAction] Error saving chapter ${chapterNumber} for novel ${novelId}:`, error);
    const errorMessage = error instanceof Error ? error.message : `Error desconocido al guardar el capítulo ${chapterNumber}.`;
    return {
      message: `Error al guardar capítulo: ${errorMessage}`,
      success: false,
    };
  }
}

const deleteNovelSchema = z.object({
  novelId: z.string().min(1, "El ID de la novela es obligatorio."),
  infoJsonSha: z.string().min(1, "El SHA del archivo info.json es obligatorio para la eliminación.")
});

interface DeleteNovelState {
  message: string;
  success: boolean;
  deletedNovelId?: string;
}

export async function deleteNovelAction(
  prevState: DeleteNovelState | null,
  formData: FormData
): Promise<DeleteNovelState> {
  const rawFormData = {
    novelId: formData.get('novelId') as string,
    infoJsonSha: formData.get('infoJsonSha') as string,
  };

  const validatedFields = deleteNovelSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    const fieldErrors = validatedFields.error.flatten().fieldErrors;
    const errorMessages = Object.values(fieldErrors).flat().join(' ');
    console.error("Delete novel validation errors:", fieldErrors);
    return {
      message: `Error de validación al eliminar: ${errorMessages}`,
      success: false,
    };
  }

  const { novelId, infoJsonSha } = validatedFields.data;
  const filePath = `${novelId}/info.json`;
  const commitMessage = `feat: Delete novel info for ${novelId}`;

  if (!infoJsonSha) {
    return {
      message: "Error: El SHA del archivo info.json es necesario para eliminar la novela y no fue proporcionado.",
      success: false,
    };
  }

  try {
    await deleteFileInRepo(filePath, commitMessage, infoJsonSha);
    
    revalidatePath('/');
    revalidatePath('/admin/dashboard');

    return {
      message: `La información de la novela '${novelId}' ha sido eliminada (info.json). Los archivos de capítulo permanecen en el repositorio y deben eliminarse manualmente si es necesario.`,
      success: true,
      deletedNovelId: novelId,
    };
  } catch (error) {
    console.error(`Error deleting novel info.json for ${novelId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al eliminar el archivo de información de la novela.";
    return {
      message: `Error al eliminar la novela: ${errorMessage}`,
      success: false,
    };
  }
}

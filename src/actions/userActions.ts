
'use server';

import { z } from 'zod';
import { createFileInRepo, fetchFileContent } from '@/lib/github';
import type { User } from '@/lib/types';

const registerUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").regex(/^[a-zA-Z0-9_.-]+$/, "Nombre de usuario inválido. Solo letras, números, '_', '-', '.' son permitidos."),
  discordUsername: z.string().min(2, "El usuario de Discord es obligatorio."),
});

export async function registerUserAction(
  prevState: { message: string; success: boolean; } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; }> {
  const rawFormData = {
    username: formData.get('username') as string,
    discordUsername: formData.get('discordUsername') as string,
  };

  const validatedFields = registerUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { username, discordUsername } = validatedFields.data;
  const filePath = `users/${username}.json`;

  // Check if user file already exists
  try {
    const existingUserFile = await fetchFileContent(filePath);
    if (existingUserFile) {
      return { message: `El nombre de usuario '${username}' ya está en uso. Por favor, elige otro.`, success: false };
    }
  } catch (error) {
    // This might be a network error or an error from fetchFileContent if it's not a 404.
    // If fetchFileContent returns null for 404, this block might not be hit for "file not found".
    // Let's assume fetchFileContent handles 404s by returning null and doesn't throw for that.
  }

  const userJson: User = {
    username,
    discordUsername,
  };
  const userJsonContent = JSON.stringify(userJson, null, 2);
  const commitMessage = `feat: Register new user - ${username}`;

  try {
    await createFileInRepo(filePath, userJsonContent, commitMessage);
    return { message: `Usuario '${username}' registrado con éxito. Ahora puedes iniciar sesión.`, success: true };
  } catch (error) {
    console.error("Error creating user file:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al registrar el usuario.";
    return { message: `Error al registrar usuario: ${errorMessage}`, success: false };
  }
}

const loginUserSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es obligatorio."),
});

export async function loginUserAction(
  prevState: { message: string; success: boolean; username?: string; } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; username?: string; }> {
  const rawFormData = {
    username: formData.get('username') as string,
  };

  const validatedFields = loginUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { username } = validatedFields.data;
  const filePath = `users/${username}.json`;

  try {
    const userFile = await fetchFileContent(filePath);
    if (userFile) {
      // In a real system, you'd also verify a password here.
      // For this simulation, existence of the file means login is successful.
      return { message: `Inicio de sesión exitoso para '${username}'.`, success: true, username };
    } else {
      return { message: `Nombre de usuario '${username}' no encontrado o incorrecto.`, success: false };
    }
  } catch (error) {
    console.error("Error during login:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido durante el inicio de sesión.";
    return { message: `Error al iniciar sesión: ${errorMessage}`, success: false };
  }
}

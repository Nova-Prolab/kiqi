
'use server';

import { z } from 'zod';
import { createFileInRepo, fetchFileContent, fetchFromGitHub } from '@/lib/github';
import type { User } from '@/lib/types';

// Define GitHubFile interface locally if not centrally available and needed for fetchFromGitHub response
interface GitHubFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  // Add other properties if needed, like sha, download_url etc.
}


const registerUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres.").regex(/^[a-zA-Z0-9_.-]+$/, "Nombre de usuario inválido. Solo letras, números, '_', '-', '.' son permitidos."),
  email: z.string().email("Correo electrónico inválido."),
});

export async function registerUserAction(
  prevState: { message: string; success: boolean; } | null,
  formData: FormData
): Promise<{ message: string; success: boolean; }> {
  const rawFormData = {
    username: formData.get('username') as string,
    email: formData.get('email') as string,
  };

  const validatedFields = registerUserSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      message: "Error de validación: " + Object.values(validatedFields.error.flatten().fieldErrors).flat().join(' '),
      success: false,
    };
  }

  const { username, email } = validatedFields.data;
  const filePath = `users/${username}.json`;

  // Check if user file (username) already exists
  try {
    const existingUserFile = await fetchFileContent(filePath);
    if (existingUserFile) {
      return { message: `El nombre de usuario '${username}' ya está en uso. Por favor, elige otro.`, success: false };
    }
  } catch (error) {
    // Assuming fetchFileContent returns null for 404s and doesn't throw.
    // If it throws for non-404, an error message will be shown by the generic catch block below.
  }

  // Check if email already exists in another user's file
  try {
    const allUserFiles = await fetchFromGitHub<GitHubFile[]>('contents/users/');
    if (allUserFiles && Array.isArray(allUserFiles)) {
      for (const file of allUserFiles) {
        if (file.type === 'file' && file.name.endsWith('.json') && file.name !== `${username}.json`) {
          const fileData = await fetchFileContent(file.path);
          if (fileData) {
            try {
              const otherUser: User = JSON.parse(fileData.content);
              if (otherUser.email && otherUser.email.toLowerCase() === email.toLowerCase()) {
                return { message: `El correo electrónico '${email}' ya está registrado con otro usuario.`, success: false };
              }
            } catch (parseError) {
              console.warn(`Could not parse user file ${file.path} during email check:`, parseError);
              // Continue checking other files
            }
          }
        }
      }
    }
  } catch (error) {
     console.error("Error fetching user list for email check:", error);
     // Potentially return a generic error or allow registration if user list can't be fetched?
     // For now, let it proceed to the creation attempt which might fail or succeed.
     // Depending on requirements, you might want to make this a hard fail.
  }


  const userJson: User = {
    username,
    email,
  };
  const userJsonContent = JSON.stringify(userJson, null, 2);
  const commitMessage = `feat: Register new user - ${username}`;

  try {
    await createFileInRepo(filePath, userJsonContent, commitMessage);
    return { message: `Usuario '${username}' registrado con éxito. Ahora puedes iniciar sesión.`, success: true };
  } catch (error) {
    console.error("Error creating user file:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido al registrar el usuario.";
     // Check if the error is because the file already exists (code 422 from GitHub)
    if (errorMessage.includes('422') || (error && typeof error === 'object' && 'status' in error && error.status === 422)) {
      return {
        message: `Error al registrar: El nombre de usuario '${username}' ya existe. Elige otro.`,
        success: false,
      };
    }
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
    // If fetchFileContent returns null for 404, it might not throw. This catch is for other errors.
    const errorMessage = error instanceof Error ? error.message : "Error desconocido durante el inicio de sesión.";
    return { message: `Error al iniciar sesión: ${errorMessage}`, success: false };
  }
}

import type { Metadata } from 'next';
import ProfilePageClient from '@/components/profile/ProfilePageClient';

export const metadata: Metadata = {
  title: 'Editar Perfil - Kiqi!',
  description: 'Gestiona tu nombre y avatar para los comentarios.',
};

export default function ProfilePage() {
  return <ProfilePageClient />;
}

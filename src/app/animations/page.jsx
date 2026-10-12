import AnimationsLibrary from '@/components/animations/AnimationsLibrary';
import { getPublishedAnimations } from '@/libs/supabase/latestAnimation';

export const revalidate = 60;

export const metadata = {
  title: 'Library',
};

export default async function AnimationsPage() {
  const animations = await getPublishedAnimations();
  return <AnimationsLibrary animations={animations} />;
}

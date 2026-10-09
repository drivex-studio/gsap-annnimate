import LandingClient from '@/components/landing/LandingClient';
import { getPublishedAnimations, getShippedRecently } from '@/libs/supabase/latestAnimation';

export default async function HomePage() {
  const [animations, shippedRecently] = await Promise.all([
    getPublishedAnimations(),
    getShippedRecently(),
  ]);

  return <LandingClient animations={animations} shippedRecently={shippedRecently} />;
}

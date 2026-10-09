import LandingClient from "@/components/landing/LandingClient"; 
import { getLatestAnimation } from '@/libs/supabase/latestAnimation';

export default async function ProjectPage() {
  const latestAnimation = await getLatestAnimation();
  return (
    <>
      <LandingClient latestAnimation={latestAnimation} />
    </>
  );
}

import { Suspense } from 'react';
import LoginPage from '@/components/login/LoginPage';

export const metadata = {
  title: 'Sign in',
  robots: { index: false },
};

const CAROUSEL_IMAGES = [];

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage images={CAROUSEL_IMAGES} />
    </Suspense>
  );
}

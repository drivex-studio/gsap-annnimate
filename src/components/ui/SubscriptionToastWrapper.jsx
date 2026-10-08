'use client';
import React, { useRef, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { usePageEnterAnimation } from '@/providers/AnimationProvider';

const SUBSCRIPTION_MESSAGES = {
  newsletter: {
    title: "You're in. Welcome to the Annnimate newsletter.",
    description: "Expect one short email when there's something worth saying."
  },
  kits: {
    title: "You're on the list.",
    description: "We'll let you know the moment the next Kit ships."
  }
};

function SubscriptionToastLogic() {
  let searchParams = useSearchParams();
  let pathname = usePathname();
  let router = useRouter();
  
  let subscribedKey = searchParams?.get('subscribed') || null;
  let hasToasted = useRef(false);

  usePageEnterAnimation(() => {
    if (!subscribedKey || hasToasted.current) return;
    
    let message = SUBSCRIPTION_MESSAGES[subscribedKey];
    if (!message) return;
    
    hasToasted.current = true;
    toast.success(message.title, {
      description: message.description,
      duration: 8000
    });
    
    let newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('subscribed');
    let queryString = newParams.toString();
    
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, {
      scroll: false
    });
  }, [subscribedKey, pathname], 'subscription-confirmed-toast', !!subscribedKey);

  return null;
}

export function SubscriptionToastWrapper() {
  return (
    <Suspense fallback={null}>
      <SubscriptionToastLogic />
    </Suspense>
  );
}

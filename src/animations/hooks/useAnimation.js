'use client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/libs/supabase/client';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider';
import { toast } from 'sonner';
import { analytics } from '@/libs/utils/analytics';
import { events } from '@/libs/utils/events';

export function useAnimation(animationId, initialIsSaved = false, animationData = null) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [animData, setAnimData] = useState(animationData);
  const router = useTransitionRouter();

  useEffect(() => {
    const supabase = createClient();

    async function loadUserData() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (animationId && !animationData) {
        const { data } = await supabase
          .from('animations')
          .select('id, title, slug, category')
          .eq('id', animationId)
          .single();
        if (data) setAnimData(data);
      }
    }

    loadUserData();
  }, [animationId, animationData]);

  const trackView = useCallback(async () => {
    if (animationId) {
      try {
        await fetch('/api/animations/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ animationId }),
        });
      } catch (err) {}
    }
  }, [animationId]);

  const toggleSave = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!user) {
      toast.error('Please sign in to save animations');
      router.push('/login');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/animations/save', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ animationId }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save animation');
      }

      setIsSaved(!isSaved);

      if (isSaved) {
        analytics.animation.unsaved(animationId, animData?.title || 'Unknown', animData?.category || 'Unknown');
        toast.success('Animation removed from saved');
      } else {
        analytics.animation.saved(animationId, animData?.title || 'Unknown', animData?.category || 'Unknown');
        events.animationSaved(animationId, animData?.title || 'Unknown', animData?.category || 'Unknown');
        toast.success('Animation saved!');
      }

      router.refresh();
    } catch (err) {
      console.error('Error toggling save:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [animationId, isSaved, isLoading, user, router, animData]);

  return { isSaved, isLoading, user, trackView, toggleSave };
}

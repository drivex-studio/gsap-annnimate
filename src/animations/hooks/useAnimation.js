import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/libs/supabase/client'; // module id: 416983
import { useTransitionRouter } from '@/providers/TransitionRouterProvider'; // module id: 676040
import { toast } from 'sonner'; // module id: 846696
import { analytics } from '@/libs/utils/analytics'; // module id: 943348
import { events } from '@/libs/utils/events'; // module id: 185161 (Mapped)

// module id: 488843
export function useAnimation(animationId, initialIsSaved = false, animationData = null) { // original mangled: e, t, n
  let [isSaved, setIsSaved] = useState(initialIsSaved); // original mangled: r, i
  let [isLoading, setIsLoading] = useState(false); // original mangled: s, l
  let [user, setUser] = useState(null); // original mangled: h, p
  let [animData, setAnimData] = useState(animationData); // original mangled: x, g
  let router = useTransitionRouter(); // original mangled: v

  useEffect(() => {
    let supabase = createClient();
    (async () => {
      let { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
      
      if (animationId && !animationData) {
        let { data } = await supabase.from("animations")
          .select("id, title, slug, category")
          .eq("id", animationId)
          .single();
        if (data) setAnimData(data);
      }
    })();
  }, [animationId, animationData]);

  let trackView = useCallback(async () => { // original mangled: b
    if (animationId) {
      try {
        await fetch("/api/animations/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animationId })
        });
      } catch (err) {}
    }
  }, [animationId]);

  let toggleSave = useCallback(async (e) => { // original mangled: y
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      toast.error("Please sign in to save animations");
      router.push("/login");
      return;
    }
    
    if (!isLoading) {
      setIsLoading(true);
      try {
        let res = await fetch("/api/animations/save", {
          method: isSaved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ animationId })
        });
        
        if (!res.ok) {
          let errData = await res.json();
          throw new Error(errData.error || "Failed to save animation");
        }
        
        setIsSaved(!isSaved);
        
        if (isSaved) {
          analytics.animation.unsaved(animationId, animData?.title || "Unknown", animData?.category || "Unknown");
          toast.success("Animation removed from saved");
        } else {
          analytics.animation.saved(animationId, animData?.title || "Unknown", animData?.category || "Unknown");
          events.animationSaved(animationId, animData?.title || "Unknown", animData?.category || "Unknown");
          toast.success("Animation saved!");
        }
        
        router.refresh();
      } catch (err) {
        console.error("Error toggling save:", err);
        toast.error(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    }
  }, [animationId, isSaved, isLoading, user, router, animData]);

  return { isSaved, isLoading, user, trackView, toggleSave };
}

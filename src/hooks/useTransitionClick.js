"use client"; 
import { useContext } from "react";
import { setTransitionTarget } from '@/libs/config/getTransitionLabel'
import TransitionRouterContext from "@/providers/TransitionRouterProvider";

export function useTransitionClick(targetPath, { replace = false, onClick } = {}) {
  const router = useContext(TransitionRouterContext);
  
  return (event) => {
    onClick?.(event);
    
    if (
      !event.defaultPrevented && 
      router && 
      !event.metaKey && 
      !event.ctrlKey && 
      !event.shiftKey && 
      !event.altKey && 
      event.button !== 1 && 
      typeof targetPath === "string" && 
      targetPath.startsWith("/")
    ) {
      event.preventDefault();
      setTransitionTarget(targetPath);
      
      if (replace) {
        router.replace(targetPath);
      } else {
        router.push(targetPath);
      }
    }
  };
}

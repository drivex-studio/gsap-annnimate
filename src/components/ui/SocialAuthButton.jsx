import React from 'react';
import { InlineLoader } from '@/components/ui/InlineLoader';

export function SocialAuthButton({ icon, label, loading, onClick }) {
 return (
  <button
  type="button"
  onClick={onClick}
  disabled={loading}
  className="text-mono-sm flex h-48 w-full items-center justify-center gap-10 border border-foreground/15 bg-surface text-foreground transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/5 disabled:opacity-50"> 
  {loading ? 
  <InlineLoader size="16" color="currentColor" /> : icon}
  <span>{label}</span>
 </button>
 );
}

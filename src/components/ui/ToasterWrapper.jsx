import React from 'react'; 
import { Toaster } from 'sonner'; 
import { cn } from '@/libs/utils/className'; 

export function ToasterWrapper({ ...props }) {
  return (
    <div data-theme="dark">
      <Toaster
        theme="dark"
        position="bottom-center"
        gap={8}
        toastOptions={{
          duration: 3000,
          unstyled: true,
          classNames: {
            toast: cn(
              'flex w-fit min-h-48 max-w-[90vw] items-center gap-12',
              'border border-foreground/10 bg-surface px-16 py-12',
              'text-foreground shadow-[0_8px_40px_rgba(0,0,0,0.45)]'
            ),
            title: 'text-body-sm font-medium text-foreground',
            description: 'text-body-sm mt-4 text-foreground-muted',
            actionButton: cn(
              'text-body-sm font-medium shrink-0 bg-foreground px-10 py-6 text-background',
              'transition-opacity duration-(--duration-quick) ease-(--ease-expo-out) hover:opacity-90'
            ),
            cancelButton: cn(
              'text-body-sm font-medium shrink-0 border border-foreground/15 px-10 py-6 text-foreground-muted',
              'transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:bg-foreground/5 hover:text-foreground'
            ),
            closeButton: cn(
              '!border-0 !bg-transparent !shadow-none text-foreground-muted',
              'transition-colors duration-(--duration-quick) ease-(--ease-expo-out)',
              'hover:!bg-transparent hover:text-foreground'
            ),
            icon: 'mr-2 shrink-0',
            success: '[&_[data-icon]]:text-brand',
            error: '[&_[data-icon]]:text-red-400',
            warning: '[&_[data-icon]]:text-amber-400',
            info: '[&_[data-icon]]:text-foreground',
            loading: '[&_[data-icon]]:text-foreground-muted'
          }
        }}
        expand={false}
        closeButton={true}
        {...props}
      />
    </div>
  );
}

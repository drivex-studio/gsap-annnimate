"use client";
import React, { useState, useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Button from '@/components/ui/Button';

const isValidCode = (code) => /^\d{6}$/.test(code);

export default function VerificationForm({ onVerify }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputRef = useRef(null);
  const charRefs = useRef([]);
  const prevLengthRef = useRef(0);

  useLayoutEffect(() => {
    const prevLength = prevLengthRef.current;
    prevLengthRef.current = code.length;

    if (!(code.length <= prevLength)) {
      for (let idx = prevLength; idx < code.length; idx++) {
        const charEl = charRefs.current[idx];
        if (charEl) {
          gsap.fromTo(
            charEl,
            { y: 14, autoAlpha: 0, scale: 0.85 },
            {
              y: 0,
              autoAlpha: 1,
              scale: 1,
              duration: 0.5,
              ease: 'expo.out',
              delay: (idx - prevLength) * 0.05,
              overwrite: true,
            }
          );
        }
      }
    }
  }, [code]);

  const forceCursorToEnd = () => {
    const el = inputRef.current;
    if (el) {
      el.setSelectionRange(el.value.length, el.value.length);
    }
  };

  const handleVerify = async (codeToVerify) => {
    if (!isLoading) {
      setError('');
      setIsLoading(true);
      try {
        await onVerify(codeToVerify);
        setIsSuccess(true);
      } catch (err) {
        console.error('Code verification error:', err);
        setError("That code didn't work. It may have expired, request a new code below.");
        setIsLoading(false);
      }
    }
  };

  if (isSuccess) {
    return (
      <div className="border-t border-foreground/10 pt-16">
        <p role="status" className="text-body-sm text-foreground">
          Signed in. One moment, taking you to Annnimate.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        isValidCode(code) ? handleVerify(code) : setError('Enter the 6-digit code from the email.');
      }}
      noValidate
      className="flex flex-col gap-12 border-t border-foreground/10 pt-16"
    >
      <label htmlFor="signin-code" className="text-body-sm text-foreground-muted">
        Enter the 6-digit code from the email.
      </label>
      
      {error ? (
        <p role="alert" className="text-mono-sm text-brand">
          {error}
        </p>
      ) : null}
      
      <div className="flex items-stretch gap-12">
        <div className={`relative min-w-0 flex-1 ${isLoading ? 'opacity-50' : ''}`}>
          <div aria-hidden="true" className="grid h-48 grid-cols-6 gap-6">
            {Array.from({ length: 6 }, (_, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-center overflow-hidden border bg-transparent transition-colors duration-(--duration-quick) ease-(--ease-expo-out) ${
                  error
                    ? 'border-brand'
                    : isFocused && idx === code.length && !isLoading
                    ? 'border-foreground'
                    : 'border-foreground/20'
                }`}
              >
                <span
                  ref={(el) => {
                    charRefs.current[idx] = el;
                  }}
                  className={`font-mono text-[20px] ${
                    code[idx] ? 'text-foreground' : 'text-foreground-muted/40'
                  }`}
                >
                  {code[idx] || '0'}
                </span>
              </div>
            ))}
          </div>
          
          <input
            ref={inputRef}
            id="signin-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => {
              const newCode = String(e.target.value || '')
                .replace(/\D/g, '')
                .slice(0, 6);
              setCode(newCode);
              
              if (error) setError('');
              if (isValidCode(newCode)) handleVerify(newCode);
            }}
            onFocus={() => {
              setIsFocused(true);
              requestAnimationFrame(forceCursorToEnd);
            }}
            onBlur={() => setIsFocused(false)}
            onSelect={forceCursorToEnd}
            disabled={isLoading}
            maxLength={6}
            aria-invalid={error ? 'true' : 'false'}
            className="absolute inset-0 size-full cursor-text opacity-0"
          />
        </div>
        
        <Button
          type="submit"
          theme="surface"
          size="sm"
          loading={isLoading}
          disabled={code.length < 6}
        >
          Sign in
        </Button>
      </div>
    </form>
  );
}

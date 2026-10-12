'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import Link from '@/components/navigation/Link'; 
import NewsletterProfilePanel from '@/components/ui/NewsletterProfilePanel';
import { analytics } from '@/libs/utils/analytics'; 
import { buildKitTouch, parseFirstTouch, KIT_TOUCH_COOKIE } from '@/libs/auth/serialize';

export const STARTER_PROMPT_KEY = 'anm_starter_prompt_dismissed_v1';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PACK_SOURCES = new Set([
  'starter-pack',
  'animations-library',
  'animations-detail',
  'animations-list-modal',
  'mobile-detail',
  'paywall-block',
  'kit-reveal-ad',
  'kit-reveal-page',
  'homepage',
  'pricing',
  'alternatives',
  'compare',
  'reference-rail'
]);

export function suppressStarterPrompt() {
  try {
    window.localStorage.setItem(STARTER_PROMPT_KEY, String(Date.now()));
  } catch {}
}

export function readSubscriberId() {
  if (typeof document === 'undefined') return null;
  const touch = buildKitTouch({
    getParam: (param) => new URLSearchParams(window.location.search).get(param)
  });
  if (touch?.id) return touch.id;
  
  const cookieMatch = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${KIT_TOUCH_COOKIE}=`))
    ?.slice(KIT_TOUCH_COOKIE.length + 1);
    
  return parseFirstTouch(cookieMatch)?.id || null;
}

/* --- NewsletterEyebrow --- */

export function NewsletterEyebrow({
  primary = 'Weekly drop',
  secondary = 'Join over 1,000+ developers and designers'
}) {
  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <span className="text-foreground">{primary}</span>
      <span aria-hidden="true" className="inline-block size-8 bg-brand" />
      <span>{secondary}</span>
    </div>
  );
}

/* --- NewsletterForm (Default) --- */

export default function NewsletterForm({
  source = 'footer',
  eyebrow,
  buttonLabel = 'Join',
  buttonSize = 'sm',
  inputSize = 'sm',
  emailPlaceholder = 'you@studio.com',
  idPrefix,
  className = '',
  wantedComponent,
  onSuccess,
  compact = false,
  buttonFullWidth = false,
  consent = 'checkbox',
  consentCopy = null,
  askName = true,
  successPanel = null,
  fieldStyle = 'underline',
  fieldLabel = 'Your email address'
}) {
  const [email, setEmail] = useState('');
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [errors, setErrors] = useState({});
  const [subscribedEmail, setSubscribedEmail] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileDone, setIsProfileDone] = useState(false);
  
  const emailInputRef = useRef(null);
  const policyCheckboxRef = useRef(null);
  const formRef = useRef(null);
  const honeypotRef = useRef(null);
  const hasViewedRef = useRef(false);
  const hasStartedRef = useRef(false);

  const getAnalyticsContext = () => ({
    source: source || 'unknown',
    page_url: window.location.href
  });

  useEffect(() => {
    const el = formRef.current;
    if (!el || hasViewedRef.current || typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasViewedRef.current) {
          hasViewedRef.current = true;
          analytics.track('newsletter_form_viewed', getAnalyticsContext());
          observer.disconnect();
        }
      }
    }, { threshold: 0.4 });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, [source]);

  const validateForm = (valEmail, valAcceptedPolicy, valConsentType) => {
    const errs = {};
    const trimmedEmail = valEmail.trim();
    
    if (trimmedEmail) {
      if (!EMAIL_REGEX.test(trimmedEmail)) errs.email = 'Enter a valid email address.';
    } else {
      errs.email = 'Email is required.';
    }
    
    if (valConsentType === 'checkbox' && !valAcceptedPolicy) {
      errs.policy = 'Please accept the privacy policy to continue.';
    }
    
    return errs;
  };

  const handleSubscribeSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || isSubscribed) return;
    
    const validationErrors = validateForm(email, acceptedPolicy, consent);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      analytics.track('newsletter_form_validation_failed', {
        ...getAnalyticsContext(),
        errors: Object.keys(validationErrors)
      });
      if (validationErrors.email) {
        emailInputRef.current?.focus();
      } else if (validationErrors.policy) {
        policyCheckboxRef.current?.focus();
      }
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          source,
          wantedComponent: wantedComponent || undefined,
          website: honeypotRef.current?.value || undefined,
          metadata: {
            page_url: window.location.href,
            referrer: typeof document !== 'undefined' && document.referrer || null
          }
        })
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not subscribe');
      
      analytics.track('newsletter_subscribed', {
        source: source || 'unknown',
        page_url: window.location.href
      });
      
      toast.success(PACK_SOURCES.has(source) 
        ? 'Almost there. Open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.' 
        : 'Almost there. Open the email from julian@annnimate.com and click confirm.'
      );
      
      suppressStarterPrompt();
      onSuccess?.(email.trim());
      setSubscribedEmail(email.trim());
      
      if (askName) {
        analytics.track('newsletter_profile_shown', getAnalyticsContext());
      } else {
        setIsProfileDone(true);
      }
      
      setIsSubscribed(true);
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Try again?');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isProfileLoading) return;
    
    const trimmedName = firstName.trim();
    if (!trimmedName) {
      handleSkipProfile();
      return;
    }
    
    setIsProfileLoading(true);
    try {
      await fetch('/api/newsletter/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: subscribedEmail,
          firstName: trimmedName
        })
      });
      analytics.track('newsletter_profile_completed', getAnalyticsContext());
    } catch (err) {
      // Silently fail profile updates
    } finally {
      setIsProfileLoading(false);
      setIsProfileDone(true);
    }
  };

  const handleSkipProfile = () => {
    if (isProfileLoading) return;
    analytics.track('newsletter_profile_skipped', getAnalyticsContext());
    setIsProfileDone(true);
  };

  const prefix = idPrefix || source;
  const idName = `${prefix}-newsletter-firstname`;
  const idEmail = `${prefix}-newsletter-email`;
  const idPolicy = `${prefix}-newsletter-policy`;
  const idEmailError = `${idEmail}-error`;
  const idPolicyError = `${idPolicy}-error`;
  
  const isBoxed = fieldStyle === 'boxed';
  const baseInputClass = `${inputSize === 'lg' 
    ? (isBoxed ? 'text-body-lg py-14' : 'text-body-lg pt-10 pb-20') 
    : (isBoxed ? 'text-body-sm py-10' : 'text-body-sm pt-8 pb-16')
  } flex-1 min-w-0 rounded-none bg-transparent px-0 text-foreground placeholder:text-foreground-muted/60 focus:outline-none disabled:opacity-50 transition-colors duration-(--duration-quick) ease-(--ease-expo-out)`;
  
  const stateInputClass = isBoxed
    ? (errors.email ? 'border border-brand bg-surface px-16' : 'border border-foreground/25 bg-surface px-16 focus:border-foreground')
    : (errors.email ? 'border-b border-brand' : 'border-b border-foreground/20 focus:border-foreground');

  return (
    <form
      ref={formRef}
      onSubmit={isSubscribed ? handleProfileSubmit : handleSubscribeSubmit}
      noValidate
      className={`flex flex-col gap-16 ${className}`}
    >
      {eyebrow || null}
      
      {isSubscribed ? (
        isProfileDone ? (
          successPanel || (
            <NewsletterProfilePanel 
              email={subscribedEmail} 
              wantsPack={PACK_SOURCES.has(source)} 
              source={source || 'unknown'} 
              onChangeAddress={() => {
                setEmail(subscribedEmail);
                setIsSubscribed(false);
                setIsProfileDone(false);
              }}
            />
          )
        ) : (
          <Fragment>
            <div className="flex flex-col gap-6">
              <p className="text-body-sm text-foreground">
                {PACK_SOURCES.has(source) 
                  ? 'Almost there - open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.' 
                  : 'Almost there - open the email from julian@annnimate.com and click confirm.'}
              </p>
              <p className="text-body-sm text-foreground/70">
                One quick thing: what should we call you?
              </p>
            </div>
            
            <div className="relative flex flex-col">
              <label htmlFor={idName} className="sr-only">First name</label>
              <input
                id={idName}
                type="text"
                autoComplete="given-name"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isProfileLoading}
                autoFocus
                className={`${baseInputClass} border-b border-foreground/20 focus:border-foreground`}
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-16">
              <button
                type="button"
                onClick={handleSkipProfile}
                disabled={isProfileLoading}
                className="text-mono-sm text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                Skip
              </button>
              <Button type="submit" theme="brand" size={buttonSize} loading={isProfileLoading} disabled={!firstName.trim()}>
                Save
              </Button>
            </div>
          </Fragment>
        )
      ) : (
        <Fragment>
          <div className="relative flex flex-col">
            <label htmlFor={idEmail} className={isBoxed ? 'text-mono-sm mb-8 text-foreground' : 'sr-only'}>
              {isBoxed ? fieldLabel : 'Your email'}
            </label>
            {errors.email ? (
              <p id={idEmailError} role="alert" className={isBoxed ? 'text-mono-sm order-last mt-6 text-brand' : 'text-mono-sm absolute bottom-full left-0 right-0 mb-6 text-brand'}>
                {errors.email}
              </p>
            ) : null}
            <input
              ref={emailInputRef}
              id={idEmail}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!hasStartedRef.current) {
                  hasStartedRef.current = true;
                  analytics.track('newsletter_form_started', getAnalyticsContext());
                }
                if (errors.email) {
                  setErrors(prev => {
                    const { email: _removed, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              disabled={isLoading}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? idEmailError : undefined}
              className={`${baseInputClass} ${stateInputClass}`}
            />
          </div>
          
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={`${prefix}-newsletter-website`}>Website</label>
            <input ref={honeypotRef} id={`${prefix}-newsletter-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          
          <div className="relative">
            <div className={compact ? 'flex flex-col gap-12' : 'flex flex-wrap items-start justify-between gap-16'}>
              {consent === 'notice' ? (
                <p className="text-mono-sm m-0 max-w-[36ch] self-center text-foreground-muted">
                  {consentCopy?.before || 'By signing up you agree to the'}
                  {' '}
                  <TextLink href="/privacy" className="text-foreground">
                    {consentCopy?.link || 'privacy policy'}
                  </TextLink>
                  {consentCopy?.after || '.'}
                </p>
              ) : (
                <label htmlFor={idPolicy} className={`flex cursor-pointer items-center gap-8 self-start text-foreground-muted ${compact ? 'text-body-sm' : 'text-mono-sm'}`}>
                  <input
                    ref={policyCheckboxRef}
                    id={idPolicy}
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={(e) => {
                      setAcceptedPolicy(e.target.checked);
                      if (errors.policy && e.target.checked) {
                        setErrors(prev => {
                          const { policy: _removed, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    disabled={isLoading}
                    aria-invalid={errors.policy ? 'true' : 'false'}
                    aria-describedby={errors.policy ? idPolicyError : undefined}
                    className={`size-18 cursor-pointer appearance-none bg-transparent transition-colors checked:border-brand checked:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${errors.policy ? 'border border-brand' : 'border border-foreground/30'}`}
                  />
                  <span className="inline-flex flex-wrap items-center gap-x-6">
                    <span>I agree to the</span>
                    <TextLink href="/privacy" className="text-foreground">
                      privacy policy
                    </TextLink>
                  </span>
                </label>
              )}
              
              <Button type="submit" theme="brand" size={buttonSize} loading={isLoading} className={buttonFullWidth ? 'w-full' : (compact ? 'self-end' : undefined)}>
                {buttonLabel}
              </Button>
            </div>
            
            {errors.policy ? (
              <p id={idPolicyError} role="alert" className="text-mono-sm absolute left-0 right-0 top-full mt-8 text-brand">
                {errors.policy}
              </p>
            ) : null}
          </div>
        </Fragment>
      )}
    </form>
  );
}
'use client'
import React, { Fragment, useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Link from '@/components/ui/TransitionLink'; 
import Button from '@/components/ui/Button'; 
import { analytics } from '@/libs/utils/analytics'; 

/* Data */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STARTER_PACK_SOURCES = new Set([
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

/* --- NewsletterEyebrow --- */
// module id: 42242
export function NewsletterEyebrow({
  primary = 'Weekly drop',
  secondary = 'Join over 1,000+ developers and designers'
} = {}) {
  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <span className="text-foreground">{primary}</span>
      <span aria-hidden="true" className="inline-block size-8 bg-brand" />
      <span>{secondary}</span>
    </div>
  );
}

/* --- NewsletterForm --- */
// module id: 42242
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProfileStep, setIsProfileStep] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const emailInputRef = useRef(null);
  const policyCheckboxRef = useRef(null);
  const formRef = useRef(null);
  const websiteHoneypotRef = useRef(null);
  const hasTrackedViewRef = useRef(false);
  const hasTrackedStartRef = useRef(false);

  const getAnalyticsPayload = () => ({
    source: source || 'unknown',
    page_url: window.location.href
  });

  useEffect(() => {
    const formEl = formRef.current;
    if (!formEl || hasTrackedViewRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !hasTrackedViewRef.current) {
          hasTrackedViewRef.current = true;
          analytics.track('newsletter_form_viewed', getAnalyticsPayload());
          observer.disconnect();
        }
      }
    }, {
      threshold: 0.4
    });

    observer.observe(formEl);
    return () => observer.disconnect();
  }, [source]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isProfileStep) return;

    const validationErrors = (function({ email, acceptedPolicy, consent }) {
      const errs = {};
      const trimmedEmail = email.trim();

      if (trimmedEmail) {
        if (!EMAIL_REGEX.test(trimmedEmail)) {
          errs.email = 'Enter a valid email address.';
        }
      } else {
        errs.email = 'Email is required.';
      }

      if (consent === 'checkbox' && !acceptedPolicy) {
        errs.policy = 'Please accept the privacy policy to continue.';
      }

      return errs;
    })({
      email,
      acceptedPolicy,
      consent
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      analytics.track('newsletter_form_validation_failed', {
        ...getAnalyticsPayload(),
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
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          source,
          wantedComponent: wantedComponent || undefined,
          website: websiteHoneypotRef.current?.value || undefined,
          metadata: {
            page_url: window.location.href,
            referrer: typeof document !== 'undefined' ? document.referrer : null
          }
        })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw Error(data.error || 'Could not subscribe');
      }

      analytics.track('newsletter_subscribed', {
        source: source || 'unknown',
        page_url: window.location.href
      });

      toast.success(
        STARTER_PACK_SOURCES.has(source)
          ? 'Almost there. Open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.'
          : 'Almost there. Open the email from julian@annnimate.com and click confirm.'
      );

      onSuccess?.(email.trim());
      setSubmittedEmail(email.trim());

      if (askName) {
        analytics.track('newsletter_profile_shown', getAnalyticsPayload());
      } else {
        setIsSuccess(true);
      }

      setIsProfileStep(true);
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Something went wrong. Try again?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isProfileSubmitting) return;

    const trimmedFirstName = firstName.trim();
    if (!trimmedFirstName) {
      handleProfileSkip();
      return;
    }

    setIsProfileSubmitting(true);

    try {
      await fetch('/api/newsletter/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: submittedEmail,
          firstName: trimmedFirstName
        })
      });
      analytics.track('newsletter_profile_completed', getAnalyticsPayload());
    } catch (err) {
      // Empty catch preserved from original bundle
    } finally {
      setIsProfileSubmitting(false);
      setIsSuccess(true);
    }
  };

  const handleProfileSkip = () => {
    if (!isProfileSubmitting) {
      analytics.track('newsletter_profile_skipped', getAnalyticsPayload());
      setIsSuccess(true);
    }
  };

  const prefix = idPrefix || source;
  const firstNameId = `${prefix}-newsletter-firstname`;
  const emailId = `${prefix}-newsletter-email`;
  const policyId = `${prefix}-newsletter-policy`;
  const emailErrorId = `${emailId}-error`;
  const policyErrorId = `${policyId}-error`;
  const isBoxed = fieldStyle === 'boxed';

  const inputBaseClass = isBoxed
    ? inputSize === 'lg'
      ? 'text-body-lg py-14'
      : 'text-body-sm py-10'
    : inputSize === 'lg'
      ? 'text-body-lg pt-10 pb-20'
      : 'text-body-sm pt-8 pb-16';

  const inputClassName = `${inputBaseClass} flex-1 min-w-0 rounded-none bg-transparent px-0 text-foreground placeholder:text-foreground-muted/60 focus:outline-none disabled:opacity-50 transition-colors duration-(--duration-quick) ease-(--ease-expo-out)`;

  const inputBorderClassName = isBoxed
    ? errors.email
      ? 'border border-brand bg-surface px-16'
      : 'border border-foreground/25 bg-surface px-16 focus:border-foreground'
    : errors.email
      ? 'border-b border-brand'
      : 'border-b border-foreground/20 focus:border-foreground';

  return (
    <form
      ref={formRef}
      onSubmit={isProfileStep ? handleProfileSubmit : handleEmailSubmit}
      noValidate={true}
      className={`flex flex-col gap-16 ${className}`}
    >
      {eyebrow || null}
      
      {isProfileStep ? (
        isSuccess ? (
          successPanel || (
            <p className="text-body-sm text-foreground-muted">
              <span className="text-foreground">One last step.</span>{' '}
              Open the email from julian@annnimate.com and click confirm. No email? Check spam, or reply to any of ours and we sort it.
            </p>
          )
        ) : (
          <Fragment>
            <div className="flex flex-col gap-6">
              <p className="text-body-sm text-foreground">
                {STARTER_PACK_SOURCES.has(source)
                  ? 'Almost there - open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.'
                  : 'Almost there - open the email from julian@annnimate.com and click confirm.'}
              </p>
              <p className="text-body-sm text-foreground/70">
                One quick thing: what should we call you?
              </p>
            </div>
            <div className="relative flex flex-col">
              <label htmlFor={firstNameId} className="sr-only">
                First name
              </label>
              <input
                id={firstNameId}
                type="text"
                autoComplete="given-name"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isProfileSubmitting}
                autoFocus={true}
                className={`${inputClassName} border-b border-foreground/20 focus:border-foreground`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-16">
              <button
                type="button"
                onClick={handleProfileSkip}
                disabled={isProfileSubmitting}
                className="text-mono-sm text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                Skip
              </button>
              <Button
                type="submit"
                theme="brand"
                size={buttonSize}
                loading={isProfileSubmitting}
                disabled={!firstName.trim()}
              >
                Save
              </Button>
            </div>
          </Fragment>
        )
      ) : (
        <Fragment>
          <div className="relative flex flex-col">
            <label
              htmlFor={emailId}
              className={isBoxed ? 'text-mono-sm mb-8 text-foreground' : 'sr-only'}
            >
              {isBoxed ? fieldLabel : 'Your email'}
            </label>
            {errors.email ? (
              <p
                id={emailErrorId}
                role="alert"
                className={
                  isBoxed
                    ? 'text-mono-sm order-last mt-6 text-brand'
                    : 'text-mono-sm absolute bottom-full left-0 right-0 mb-6 text-brand'
                }
              >
                {errors.email}
              </p>
            ) : null}
            <input
              ref={emailInputRef}
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!hasTrackedStartRef.current) {
                  hasTrackedStartRef.current = true;
                  analytics.track('newsletter_form_started', getAnalyticsPayload());
                }
                if (errors.email) {
                  setErrors((prev) => {
                    const { email: t, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              disabled={isSubmitting}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? emailErrorId : undefined}
              className={`${inputClassName} ${inputBorderClassName}`}
            />
          </div>
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={`${prefix}-newsletter-website`}>Website</label>
            <input
              ref={websiteHoneypotRef}
              id={`${prefix}-newsletter-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          <div className="relative">
            <div
              className={
                compact ? 'flex flex-col gap-12' : 'flex flex-wrap items-start justify-between gap-16'
              }
            >
              {consent === 'notice' ? (
                <p className="text-mono-sm m-0 max-w-[36ch] self-center text-foreground-muted">
                  {consentCopy?.before || 'By signing up you agree to the'}{' '}
                  <Link href="/privacy" className="text-foreground">
                    {consentCopy?.link || 'privacy policy'}
                  </Link>
                  {consentCopy?.after || '.'}
                </p>
              ) : (
                <label
                  htmlFor={policyId}
                  className={`flex cursor-pointer items-center gap-8 self-start text-foreground-muted ${
                    compact ? 'text-body-sm' : 'text-mono-sm'
                  }`}
                >
                  <input
                    ref={policyCheckboxRef}
                    id={policyId}
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={(e) => {
                      setAcceptedPolicy(e.target.checked);
                      if (errors.policy && e.target.checked) {
                        setErrors((prev) => {
                          const { policy: t, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    disabled={isSubmitting}
                    aria-invalid={errors.policy ? 'true' : 'false'}
                    aria-describedby={errors.policy ? policyErrorId : undefined}
                    className={`size-18 cursor-pointer appearance-none bg-transparent transition-colors checked:border-brand checked:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${
                      errors.policy ? 'border border-brand' : 'border border-foreground/30'
                    }`}
                  />
                  <span className="inline-flex flex-wrap items-center gap-x-6">
                    <span>I agree to the</span>
                    <Link href="/privacy" className="text-foreground">
                      privacy policy
                    </Link>
                  </span>
                </label>
              )}
              <Button
                type="submit"
                theme="brand"
                size={buttonSize}
                loading={isSubmitting}
                className={buttonFullWidth ? 'w-full' : compact ? 'self-end' : undefined}
              >
                {buttonLabel}
              </Button>
            </div>
            {errors.policy ? (
              <p
                id={policyErrorId}
                role="alert"
                className="text-mono-sm absolute left-0 right-0 top-full mt-8 text-brand"
              >
                {errors.policy}
              </p>
            ) : null}
          </div>
        </Fragment>
      )}
    </form>
  );
}
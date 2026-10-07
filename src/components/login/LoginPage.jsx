// LoginPage.jsx
import React, { useState, useEffect, useCallback } from 'react'; // module id: 271645
import { useSearchParams } from 'next/navigation'; // module id: 618566

import { useTransitionRouter } from '@/hooks/useTransitionRouter'; // module id: 676040
import { createClient } from '@/libs/supabase/client'; // module id: 416983
import { completeSignIn } from '@/libs/auth/completeSignIn'; // module id: 633018

import { toast } from '@/components/ui/toast'; // module id: 846696

import { GithubLogo } from '@/components/icons/GithubLogo'; // module id: 260189
import { ArrowLeft } from '@/components/icons/ArrowLeft'; // module id: 301575
import { ArrowRight } from '@/components/icons/ArrowRight'; // module id: 754169
import { Envelope } from '@/components/icons/Envelope'; // module id: 718720

import { GoogleLogoIcon } from './GoogleLogoIcon';
import { SocialAuthButton } from './SocialAuthButton';
import { sanitizeRedirect, getRedirectTarget, emailRegex } from './utils';

import SiteLogo from '@/components/ui/SiteLogo'; // module id: 635566
import Button from '@/components/ui/Button'; // module id: 687989
import CustomLink from '@/components/ui/CustomLink'; // module id: 520237
import AnimatedContainer from '@/components/ui/AnimatedContainer'; // module id: 460391
import ImageCarousel from '@/components/ui/ImageCarousel'; // module id: 111235
import OtpInput from '@/components/ui/OtpInput'; // module id: 588003
import { InlineLoader } from '@/components/ui/InlineLoader'; // module id: 461376

/* --- LoginPage --- */
// module id: 281991
export default function LoginPage({ images = [] }) {
  const router = useTransitionRouter();
  const searchParams = useSearchParams();
  const defaultRedirect = sanitizeRedirect(searchParams.get('redirectTo'));

  const [email, setEmail] = useState(() => searchParams.get('email') || '');
  const [magicLinkRedirect, setMagicLinkRedirect] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [incompleteUser, setIncompleteUser] = useState(null);

  const navigateTo = useCallback(
    ({ href, hard }) => {
      if (hard) {
        window.location.assign(href);
      } else {
        router.push(href);
      }
    },
    [router]
  );

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const urlError = searchParams.get('error');
      const urlErrorDesc = searchParams.get('error_description');

      if (urlError) {
        if (urlError !== 'no_code') {
          console.error('Auth error from callback:', urlError, urlErrorDesc);
          const hasMultipleAccounts =
            typeof urlErrorDesc === 'string' && urlErrorDesc.includes('Multiple accounts');

          if (urlError === 'otp_expired') {
            toast.error('Your login link has expired. Please request a new one.');
          } else if (hasMultipleAccounts) {
            toast.error(
              'Your account has multiple emails matching different Annnimate users. Please sign in with your email instead.',
              { duration: 10000 }
            );
          } else if (urlError === 'oauth_no_subscription') {
            toast.error(
              urlErrorDesc?.replace(/\+/g, ' ') ||
                "We didn't find an Annnimate subscription at this email.",
              {
                duration: 10000,
                action: {
                  label: 'Get the library',
                  onClick: () => router.push('/pricing'),
                },
              }
            );
          } else if (urlError === 'session_error' || urlError === 'callback_error') {
            toast.error('Authentication failed. Please try again.');
          } else {
            toast.error(urlErrorDesc?.replace(/\+/g, ' ') || 'Authentication failed');
          }
        }
        window.history.replaceState(null, '', window.location.pathname);
        setIsPageLoading(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session && !window.location.hash.includes('type=recovery')) {
          return navigateTo(
            getRedirectTarget({ destination: '/animations', redirectTo: defaultRedirect })
          );
        }
      }

      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const hashError = hashParams.get('error');
        const hashErrorDesc = hashParams.get('error_description');

        if (hashError) {
          console.error('Auth error from hash:', hashError, hashErrorDesc);
          const errorCode = hashParams.get('error_code');
          const isNoSubscription =
            errorCode === 'hook_rejected' ||
            errorCode === 'access_denied' ||
            (typeof hashErrorDesc === 'string' &&
              hashErrorDesc.includes('Annnimate subscription'));
          const hasMultipleAccountsHash =
            typeof hashErrorDesc === 'string' && hashErrorDesc.includes('Multiple accounts');

          if (hashError === 'otp_expired') {
            toast.error('Your login link has expired. Please request a new one.');
          } else if (hasMultipleAccountsHash) {
            toast.error(
              'Your account has multiple emails matching different Annnimate users. Please sign in with your email instead.',
              { duration: 10000 }
            );
          } else if (isNoSubscription) {
            toast.error(
              hashErrorDesc?.replace(/\+/g, ' ') ||
                "We didn't find an Annnimate subscription at this email.",
              {
                duration: 10000,
                action: {
                  label: 'Get the library',
                  onClick: () => router.push('/pricing'),
                },
              }
            );
          } else {
            toast.error(hashErrorDesc?.replace(/\+/g, ' ') || 'Authentication failed');
          }
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
          setIsPageLoading(false);
          return;
        }

        if (accessToken && refreshToken) {
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;

            if (sessionData?.session) {
              const {
                data: { user: sessionUser },
              } = await supabase.auth.getUser();
              if (sessionUser) {
                toast.success('Welcome back!');
                window.history.replaceState(null, '', window.location.pathname);
                navigateTo(
                  getRedirectTarget({
                    destination: '/animations',
                    redirectTo: defaultRedirect,
                  })
                );
                return;
              }
            }
          } catch (err) {
            console.error('Session error:', err);
            toast.error(err.message || 'Failed to authenticate');
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
          }
        }
      }
      setIsPageLoading(false);
    })();
  }, [router, defaultRedirect, searchParams, navigateTo]);

  const handleSendMagicLink = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setEmailError('Email is required.');
      return;
    }
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Enter a valid email address.');
      return;
    }

    setEmailError('');
    setIsSendingLink(true);
    setIncompleteUser(null);

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, origin: window.location.origin }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'incomplete_user') {
          setIncompleteUser({
            email: trimmedEmail,
            checkoutUrl: data.checkout_url,
            message: data.message,
          });
          return;
        }
        throw new Error(data.error || 'Failed to send the sign-in code');
      }

      setShowOtp(true);
      setVerifiedEmail(data.email || trimmedEmail);
      setMagicLinkRedirect(data.redirectTo || null);
      setResendCountdown(60);
      toast.success('Check your email for your sign-in code.');
    } catch (err) {
      console.error('Magic link error:', err);
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSendingLink(false);
    }
  }, [email]);

  const onSubmitEmail = async (e) => {
    e.preventDefault();
    await handleSendMagicLink();
  };

  const onResendCode = async () => {
    if (resendCountdown > 0) return;
    await handleSendMagicLink();
  };

  const handleVerifyOtp = useCallback(
    async (token) => {
      const supabase = createClient();
      const targetEmail = verifiedEmail || email.trim();

      const { data, error } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: token,
        type: 'magiclink',
      });

      if (error || !data?.session) {
        throw error || new Error('Verification failed');
      }

      const destination = await completeSignIn({ supabase, session: data.session });
      toast.success('Welcome back!');
      navigateTo(
        getRedirectTarget({
          destination: destination,
          redirectTo: magicLinkRedirect || defaultRedirect,
        })
      );
    },
    [verifiedEmail, email, navigateTo, defaultRedirect, magicLinkRedirect]
  );

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${defaultRedirect}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      toast.error('Failed to login with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsGithubLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${defaultRedirect}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      console.error('GitHub login error:', err);
      toast.error('Failed to login with GitHub');
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[2fr_3fr]">
      <div className="relative flex flex-col bg-background">
        <div className="absolute bottom-0 right-0 top-0 hidden w-px bg-foreground/10 lg:block" />
        {isPageLoading ? (
          <div className="flex flex-1 items-center justify-center p-24">
            <InlineLoader size="32" />
          </div>
        ) : (
          <AnimatedContainer
            className="flex flex-1 flex-col gap-16 p-24 md:p-40"
            stagger={0.08}
          >
            <div className="flex items-center">
              <SiteLogo />
            </div>
            <div className="flex flex-1 items-center justify-center">
              <div className="w-full max-w-[26rem]">
                {incompleteUser ? (
                  <div className="flex flex-col gap-24">
                    <div className="flex flex-col gap-12 border border-foreground/15 bg-surface p-24 text-center">
                      <div className="flex justify-center text-brand">
                        <ArrowRight className="size-40" />
                      </div>
                      <h3 className="text-h5 m-0 text-foreground">Complete your subscription</h3>
                      <p className="text-body-sm m-0 text-foreground-muted">
                        We found an account for{' '}
                        <span className="text-foreground">{incompleteUser.email}</span>{' '}
                        but your subscription was never activated.
                      </p>
                      <div className="mt-4 flex justify-center">
                        <Button href={incompleteUser.checkoutUrl} theme="brand" size="sm">
                          Subscribe to Annnimate
                        </Button>
                      </div>
                      <p className="text-mono-sm mt-4 text-foreground-muted">
                        Once you subscribe, you'll receive a magic link to sign in.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIncompleteUser(null);
                        setEmail('');
                      }}
                      className="text-mono-sm inline-flex items-center justify-center gap-6 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
                    >
                      <ArrowLeft className="size-16" />
                      Try a different email
                    </button>
                  </div>
                ) : showOtp ? (
                  <div className="flex flex-col gap-24">
                    <div className="flex flex-col gap-16 border border-foreground/15 bg-surface p-24">
                      <div className="flex justify-center text-brand">
                        <Envelope className="size-40" />
                      </div>
                      <div className="text-center">
                        <h3 className="text-h5 m-0 text-foreground">Check your email</h3>
                        <p className="text-body-sm mt-8 text-foreground-muted">
                          We sent a sign-in code to{' '}
                          <span className="text-foreground">{email}</span>
                        </p>
                      </div>
                      <ol className="text-body-sm flex flex-col gap-8 text-foreground-muted">
                        {[
                          'Open your email inbox',
                          'Copy the 6-digit code from the email',
                          'Enter it below to sign in',
                        ].map((stepText, index) => (
                          <li key={index} className="flex items-center gap-10">
                            <span className="text-mono-sm flex size-20 shrink-0 items-center justify-center bg-foreground/10 text-foreground">
                              {index + 1}
                            </span>
                            <span>{stepText}</span>
                          </li>
                        ))}
                      </ol>
                      <OtpInput onVerify={handleVerifyOtp} />
                      <div className="border-t border-foreground/10 pt-16 text-center">
                        <p className="text-mono-sm mb-8 text-foreground-muted">
                          Didn't receive the email?
                        </p>
                        <button
                          type="button"
                          onClick={onResendCode}
                          disabled={resendCountdown > 0 || isSendingLink}
                          className="text-mono-sm text-foreground underline underline-offset-4 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-brand disabled:opacity-50 disabled:no-underline"
                        >
                          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOtp(false);
                        setEmail('');
                        setVerifiedEmail('');
                        setResendCountdown(0);
                      }}
                      className="text-mono-sm inline-flex items-center justify-center gap-6 text-foreground-muted transition-colors duration-(--duration-quick) ease-(--ease-expo-out) hover:text-foreground"
                    >
                      <ArrowLeft className="size-16" />
                      Back to login
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <header className="mb-32">
                      <h1 className="text-h3 m-0 text-foreground">Sign in to Annnimate.</h1>
                      <p className="text-body-sm mt-12 text-foreground-muted">
                        Copy code, save components, manage your plan.
                      </p>
                    </header>
                    <form onSubmit={onSubmitEmail} noValidate className="flex flex-col gap-20">
                      <div className="relative flex flex-col">
                        <label htmlFor="login-email" className="sr-only">
                          Email address
                        </label>
                        {emailError ? (
                          <p
                            role="alert"
                            className="text-mono-sm absolute bottom-full left-0 mb-6 text-brand"
                          >
                            {emailError}
                          </p>
                        ) : null}
                        <input
                          id="login-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (emailError) setEmailError('');
                          }}
                          placeholder="you@studio.com"
                          disabled={isSendingLink}
                          aria-invalid={emailError ? 'true' : 'false'}
                          className={`text-body rounded-none bg-transparent px-0 pb-16 pt-8 text-foreground placeholder:text-foreground-muted/60 transition-colors duration-(--duration-quick) ease-(--ease-expo-out) focus:outline-none disabled:opacity-50 ${
                            emailError
                              ? 'border-b border-brand'
                              : 'border-b border-foreground/20 focus:border-foreground'
                          }`}
                        />
                      </div>
                      <Button
                        type="submit"
                        theme="brand"
                        size="sm"
                        loading={isSendingLink}
                        className="w-full"
                      >
                        Continue
                      </Button>
                      <p className="text-mono-sm text-foreground-muted">
                        We'll email you a secure link to sign in instantly.
                      </p>
                    </form>
                    <div className="my-24 flex items-center gap-12">
                      <span className="h-px flex-1 bg-foreground/10" />
                      <span className="text-mono-sm text-foreground-muted">Or continue with</span>
                      <span className="h-px flex-1 bg-foreground/10" />
                    </div>
                    <div className="flex flex-col gap-12">
                      <SocialAuthButton
                        icon={<GoogleLogoIcon className="size-16" />}
                        label="Google"
                        loading={isGoogleLoading}
                        onClick={handleGoogleLogin}
                      />
                      <SocialAuthButton
                        icon={<GithubLogo className="size-16" />}
                        label="GitHub"
                        loading={isGithubLoading}
                        onClick={handleGithubLogin}
                      />
                    </div>
                    <p className="text-mono-sm mt-24 text-foreground-muted">
                      New here? Browsing and previewing need no account. You only sign in to copy
                      and save.{' '}
                      <CustomLink href="/pricing" inline className="text-foreground">
                        See plans
                      </CustomLink>
                    </p>
                  </div>
                )}
              </div>
            </div>
            <p className="text-mono-sm text-center text-foreground-muted">
              By signing in, you agree to our{' '}
              <CustomLink href="/terms" inline className="text-foreground">
                Terms
              </CustomLink>{' '}
              and{' '}
              <CustomLink href="/privacy" inline className="text-foreground">
                Privacy Policy
              </CustomLink>
              .
            </p>
          </AnimatedContainer>
        )}
      </div>
      <ImageCarousel images={images} />
    </div>
  );
}
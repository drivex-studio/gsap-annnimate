"use client";

import { useState, useEffect, useCallback, forwardRef, Fragment } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { useTransitionRouter } from '@/providers/TransitionRouterProvider';
import { createClient } from '@/libs/supabase/client';
import { Envelope, GithubLogo, ArrowLeft, ArrowRight, IconBase as PhosphorIconBase } from '@phosphor-icons/react';
import Logo from '@/assets/logos/SiteLogo';
import Button from '@/components/ui/Button';
import NavLink from '@/components/navigation/NavLink';
import AnimatedText from '@/animations/components/AnimatedText';
import AuthShowcase from '@/components/login/AuthShowcase';
import OtpInput from '@/components/login/VerificationForm';
import { InlineLoader } from '@/components/ui/InlineLoader';
import { completeSignIn } from '@/libs/auth/completeSignIn';

const GOOGLE_WEIGHTS = new Map([
  ['bold',    <Fragment><path d="M228,128a100,100,0,1,1-22.86-63.64,12,12,0,0,1-18.51,15.28A76,76,0,1,0,203.05,140H128a12,12,0,0,1,0-24h88A12,12,0,0,1,228,128Z" /></Fragment>],
  ['duotone', <Fragment><path d="M216,128a88,88,0,1,1-88-88A88,88,0,0,1,216,128Z" opacity="0.2" /><path d="M224,128a96,96,0,1,1-21.95-61.09,8,8,0,1,1-12.33,10.18A80,80,0,1,0,207.6,136H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128Z" /></Fragment>],
  ['fill',    <Fragment><path d="M128,24A104,104,0,1,0,232,128,104,104,0,0,0,128,24Zm0,184A80,80,0,1,1,181.34,68.37a8,8,0,0,1-10.67,11.92A64,64,0,1,0,191.5,136H128a8,8,0,0,1,0-16h72a8,8,0,0,1,8,8A80.09,80.09,0,0,1,128,208Z" /></Fragment>],
  ['light',   <Fragment><path d="M222,128a94,94,0,1,1-21.49-59.82,6,6,0,1,1-9.25,7.64A82,82,0,1,0,209.78,134H128a6,6,0,0,1,0-12h88A6,6,0,0,1,222,128Z" /></Fragment>],
  ['regular', <Fragment><path d="M224,128a96,96,0,1,1-21.95-61.09,8,8,0,1,1-12.33,10.18A80,80,0,1,0,207.6,136H128a8,8,0,0,1,0-16h88A8,8,0,0,1,224,128Z" /></Fragment>],
  ['thin',    <Fragment><path d="M220,128a92,92,0,1,1-21-58.55,4,4,0,0,1-6.17,5.1A84,84,0,1,0,211.91,132H128a4,4,0,0,1,0-8h88A4,4,0,0,1,220,128Z" /></Fragment>],
]);

const GoogleLogoIcon = forwardRef((props, ref) => (
  <PhosphorIconBase ref={ref} {...props} weights={GOOGLE_WEIGHTS} />
));
GoogleLogoIcon.displayName = 'GoogleLogoIcon';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeRedirectUrl = (url, fallback = '/animations') => {
  if (typeof url !== 'string' || !url.startsWith('/') || url.startsWith('//') || url.startsWith('/\\')) {
    return fallback;
  }
  return url;
};

const resolveRedirect = ({ destination, redirectTo }) => {
  const cleanRedirectTo = sanitizeRedirectUrl(redirectTo);
  if (cleanRedirectTo.startsWith('/api/teams/invites/accept')) return { href: cleanRedirectTo, hard: true };
  if (destination === '/welcome')                              return { href: '/welcome',       hard: false };
  return { href: cleanRedirectTo, hard: false };
};

const SocialButton = ({ icon, label, loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className="Login-socialBtn"
  >
    {loading ? <InlineLoader size="16" color="currentColor" /> : icon}
    <span>{label}</span>
  </button>
);

export default function Login({ images = [] }) {
  const router       = useTransitionRouter();
  const searchParams = useSearchParams();

  const redirectTo = sanitizeRedirectUrl(searchParams.get('redirectTo'));

  const [email, setEmail]                                 = useState(() => searchParams.get('email') || '');
  const [serverRedirectTo, setServerRedirectTo]           = useState(null);
  const [emailError, setEmailError]                       = useState('');
  const [isSendingLink, setIsSendingLink]                 = useState(false);
  const [isGoogleLoading, setIsGoogleLoading]             = useState(false);
  const [isGithubLoading, setIsGithubLoading]             = useState(false);
  const [showOtpState, setShowOtpState]                   = useState(false);
  const [verifiedEmail, setVerifiedEmail]                 = useState('');
  const [isInitializing, setIsInitializing]               = useState(true);
  const [resendCountdown, setResendCountdown]             = useState(0);
  const [incompleteUserContext, setIncompleteUserContext] = useState(null);

  const navigateTo = useCallback(({ href, hard }) => {
    if (hard) window.location.assign(href);
    else      router.push(href);
  }, [router]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timeoutId = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [resendCountdown]);

  useEffect(() => {
    (async () => {
      const supabase         = createClient();
      const errorParam       = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (errorParam) {
        if (errorParam !== 'no_code') {
          console.error('Auth error from callback:', errorParam, errorDescription);
          const isMultipleAccounts = typeof errorDescription === 'string' && errorDescription.includes('Multiple accounts');
          
          if (errorParam === 'otp_expired')                 toast.error('Your login link has expired. Please request a new one.');
          else if (isMultipleAccounts)                      toast.error('Your account has multiple emails matching different Annnimate users. Please sign in with your email instead.', { duration: 10000 });
          else if (errorParam === 'oauth_no_subscription')  toast.error(errorDescription?.replace(/\+/g, ' ') || "We didn't find an Annnimate subscription at this email.", { duration: 10000, action: { label: 'Get the library', onClick: () => router.push('/pricing') } });
          else if (errorParam === 'session_error' || errorParam === 'callback_error') toast.error('Authentication failed. Please try again.');
          else                                              toast.error(errorDescription?.replace(/\+/g, ' ') || 'Authentication failed');
        }
        window.history.replaceState(null, '', window.location.pathname);
        setIsInitializing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !window.location.hash.includes('type=recovery')) {
          return navigateTo(resolveRedirect({ destination: '/animations', redirectTo }));
        }
      }

      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) {
        setIsInitializing(false);
        return;
      }

      const hashParams           = new URLSearchParams(hash.substring(1));
      const accessToken          = hashParams.get('access_token');
      const refreshToken         = hashParams.get('refresh_token');
      const hashError            = hashParams.get('error');
      const hashErrorDescription = hashParams.get('error_description');

      if (hashError) {
        console.error('Auth error from hash:', hashError, hashErrorDescription);
        const errorCode              = hashParams.get('error_code');
        const isNoSubscription       = errorCode === 'hook_rejected' || errorCode === 'access_denied' || (typeof hashErrorDescription === 'string' && hashErrorDescription.includes('Annnimate subscription'));
        const isHashMultipleAccounts = typeof hashErrorDescription === 'string' && hashErrorDescription.includes('Multiple accounts');
        
        if (hashError === 'otp_expired')  toast.error('Your login link has expired. Please request a new one.');
        else if (isHashMultipleAccounts)  toast.error('Your account has multiple emails matching different Annnimate users. Please sign in with your email instead.', { duration: 10000 });
        else if (isNoSubscription)        toast.error(hashErrorDescription?.replace(/\+/g, ' ') || "We didn't find an Annnimate subscription at this email.", { duration: 10000, action: { label: 'Get the library', onClick: () => router.push('/pricing') } });
        else                              toast.error(hashErrorDescription?.replace(/\+/g, ' ') || 'Authentication failed');
        
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setIsInitializing(false);
        return;
      }

      if (!accessToken || !refreshToken) {
        setIsInitializing(false);
        return;
      }

      try {
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) throw error;
        if (data?.session) {
          const { data: { user: sessionUser } } = await supabase.auth.getUser();
          if (sessionUser) {
            toast.success('Welcome back!');
            window.history.replaceState(null, '', window.location.pathname);
            navigateTo(resolveRedirect({ destination: '/animations', redirectTo }));
            return;
          }
        }
      } catch (err) {
        console.error('Session error:', err);
        toast.error(err.message || 'Failed to authenticate');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }

      setIsInitializing(false);
    })();
  }, [router, redirectTo, searchParams, navigateTo]);

  const handleSendMagicLink = useCallback(async () => {
    const cleanEmail = email.trim();
    if (!cleanEmail)                   { setEmailError('Email is required.'); return; }
    if (!EMAIL_REGEX.test(cleanEmail)) { setEmailError('Enter a valid email address.'); return; }
    
    setEmailError('');
    setIsSendingLink(true);
    setIncompleteUserContext(null);
    
    try {
      const response = await fetch('/api/auth/magic-link', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: cleanEmail, origin: window.location.origin }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        if (data.error === 'incomplete_user') {
          setIncompleteUserContext({ email: cleanEmail, checkoutUrl: data.checkout_url, message: data.message });
          return;
        }
        throw new Error(data.error || 'Failed to send the sign-in code');
      }
      
      setShowOtpState(true);
      setVerifiedEmail(data.email || cleanEmail);
      setServerRedirectTo(data.redirectTo || null);
      setResendCountdown(60);
      toast.success('Check your email for your sign-in code.');
    } catch (err) {
      console.error('Magic link error:', err);
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsSendingLink(false);
    }
  }, [email]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    await handleSendMagicLink();
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    await handleSendMagicLink();
  };

  const handleVerifyOtp = useCallback(async (token) => {
    const supabase        = createClient();
    const { data, error } = await supabase.auth.verifyOtp({ email: verifiedEmail || email.trim(), token, type: 'magiclink' });
    
    if (error || !data?.session) throw error || new Error('Verification failed');
    
    const destination = await completeSignIn({ supabase, session: data.session });
    toast.success('Welcome back!');
    navigateTo(resolveRedirect({ destination, redirectTo: serverRedirectTo || redirectTo }));
  }, [verifiedEmail, email, navigateTo, redirectTo, serverRedirectTo]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const supabase  = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${redirectTo}` } });
      if (error) throw error;
    } catch (err) {
      console.error('Google login error:', err);
      toast.error('Failed to login with Google');
      setIsGoogleLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    setIsGithubLoading(true);
    try {
      const supabase  = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: `${window.location.origin}/api/auth/callback?redirectTo=${redirectTo}` } });
      if (error) throw error;
    } catch (err) {
      console.error('GitHub login error:', err);
      toast.error('Failed to login with GitHub');
      setIsGithubLoading(false);
    }
  };

  return (
    <div className="Login">
      <div className="Login-left">
        <div className="Login-borderRight" />
        
        {isInitializing && (
          <div className="Login-loaderWrap">
            <InlineLoader size="32" />
          </div>
        )}

        {!isInitializing && (
          <AnimatedText className="Login-content" stagger={0.08}>
            <div className="Login-logoWrap">
              <Logo />
            </div>
            
            <div className="Login-inner">
              <div className="Login-box">
                {incompleteUserContext && (
                  <div className="Login-stack">
                    <div className="Login-card">
                      <div className="Login-cardIcon">
                        <ArrowRight className="Login-iconLg" />
                      </div>
                      <h3 className="Login-cardTitle">Complete your subscription</h3>
                      <p className="Login-cardDesc">
                        We found an account for <span className="Login-highlight">{incompleteUserContext.email}</span> but your subscription was never activated.
                      </p>
                      <div className="Login-cardAction">
                        <Button href={incompleteUserContext.checkoutUrl} theme="brand" size="sm">
                          Subscribe to Annnimate
                        </Button>
                      </div>
                      <p className="Login-cardNote">
                        Once you subscribe, you'll receive a magic link to sign in.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIncompleteUserContext(null); setEmail(''); }}
                      className="Login-backBtn"
                    >
                      <ArrowLeft className="Login-iconSm" />
                      Try a different email
                    </button>
                  </div>
                )}

                {!incompleteUserContext && showOtpState && (
                  <div className="Login-stack">
                    <div className="Login-card Login-card--padded">
                      <div className="Login-cardIcon">
                        <Envelope className="Login-iconLg" />
                      </div>
                      <div className="Login-textCenter">
                        <h3 className="Login-cardTitle">Check your email</h3>
                        <p className="Login-cardDesc Login-cardDesc--mt">
                          We sent a sign-in code to <span className="Login-highlight">{email}</span>
                        </p>
                      </div>
                      
                      <ol className="Login-steps">
                        {['Open your email inbox', 'Copy the 6-digit code from the email', 'Enter it below to sign in'].map((step, index) => (
                          <li key={index} className="Login-stepItem">
                            <span className="Login-stepNum">{index + 1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                      
                      <OtpInput onVerify={handleVerifyOtp} />
                      
                      <div className="Login-cardFooter">
                        <p className="Login-cardNote Login-cardNote--mb">Didn't receive the email?</p>
                        <button
                          type="button"
                          onClick={handleResend}
                          disabled={resendCountdown > 0 || isSendingLink}
                          className="Login-linkBtn"
                        >
                          {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
                        </button>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => { setShowOtpState(false); setEmail(''); setVerifiedEmail(''); setResendCountdown(0); }}
                      className="Login-backBtn"
                    >
                      <ArrowLeft className="Login-iconSm" />
                      Back to login
                    </button>
                  </div>
                )}

                {!incompleteUserContext && !showOtpState && (
                  <div className="Login-formWrap">
                    <header className="Login-header">
                      <h1 className="Login-title">Sign in to Annnimate.</h1>
                      <p className="Login-desc">
                        Copy code, save components, manage your plan.
                      </p>
                    </header>
                    
                    <form onSubmit={handleEmailSubmit} noValidate className="Login-form">
                      <div className="Login-inputWrap">
                        <label htmlFor="login-email" className="Login-srOnly">Email address</label>
                        {emailError && (
                          <p role="alert" className="Login-errorMsg">
                            {emailError}
                          </p>
                        )}
                        <input
                          id="login-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                          placeholder="you@studio.com"
                          disabled={isSendingLink}
                          aria-invalid={emailError ? 'true' : 'false'}
                          className={emailError ? 'Login-input is-error' : 'Login-input'}
                        />
                      </div>
                      
                      <Button type="submit" theme="brand" size="sm" loading={isSendingLink} className="Login-submitBtn">
                        Continue
                      </Button>
                      
                      <p className="Login-note">
                        We'll email you a secure link to sign in instantly.
                      </p>
                    </form>
                    
                    <div className="Login-divider">
                      <span className="Login-dividerLine" />
                      <span className="Login-dividerText">Or continue with</span>
                      <span className="Login-dividerLine" />
                    </div>
                    
                    <div className="Login-socialList">
                      <SocialButton icon={<GoogleLogoIcon className="Login-iconSm" />} label="Google" loading={isGoogleLoading} onClick={handleGoogleSignIn} />
                      <SocialButton icon={<GithubLogo className="Login-iconSm" />}     label="GitHub" loading={isGithubLoading} onClick={handleGithubSignIn} />
                    </div>
                    
                    <p className="Login-footerNote">
                      New here? Browsing and previewing need no account. You only sign in to copy and save.{' '}
                      <NavLink href="/pricing" inline className="Login-link">See plans</NavLink>
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <p className="Login-terms">
              By signing in, you agree to our{' '}
              <NavLink href="/terms" inline className="Login-link">Terms</NavLink>{' '}
              and{' '}
              <NavLink href="/privacy" inline className="Login-link">Privacy Policy</NavLink>.
            </p>
          </AnimatedText>
        )}
      </div>
      
      <AuthShowcase images={images} />
    </div>
  );
}

import AnimatedButton from '@/animations/components/AnimatedButton';
import { SentToDetail } from '@/components/ui/SentToDetail';
import { analytics } from '@/libs/utils/analytics';

const SENDER_EMAIL = 'julian@annnimate.com';

export function inboxFor(email) {
  const domain = String(email || '').split('@')[1]?.toLowerCase() || '';
  
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    return {
      provider: 'gmail',
      label: 'Open Gmail',
      href: `https://mail.google.com/mail/u/0/#search/from%3A${encodeURIComponent(SENDER_EMAIL)}+in%3Aanywhere`
    };
  }
  if (/^(outlook|hotmail|live|msn)\.[a-z.]+$/.test(domain)) {
    return {
      provider: 'outlook',
      label: 'Open Outlook',
      href: 'https://outlook.live.com/mail/0/'
    };
  }
  if (/^(icloud|me|mac)\.com$/.test(domain)) {
    return {
      provider: 'icloud',
      label: 'Open iCloud Mail',
      href: 'https://www.icloud.com/mail/'
    };
  }
  if (/^(yahoo|ymail)\.[a-z.]+$/.test(domain)) {
    return {
      provider: 'yahoo',
      label: 'Open Yahoo Mail',
      href: 'https://mail.yahoo.com/'
    };
  }
  return null;
}

export default function NewsletterProfilePanel({
  email,
  wantsPack = false,
  source = 'unknown',
  onChangeAddress = null
}) {
  const inboxDetails = inboxFor(email);

  return (
    <div className="flex flex-col gap-12">
      <p className="text-body-sm text-foreground">
        One last step. Open the email from {SENDER_EMAIL} and click confirm.
        {wantsPack ? ' Your Starter Pack lands right after.' : ''}
      </p>
      
      <SentToDetail 
        to={email} 
        subject={wantsPack ? 'Confirm and grab your Starter Pack' : 'Confirm your Annnimate subscription'} 
      />
      
      <div className="flex flex-wrap items-center justify-between gap-12">
        {inboxDetails ? (
          <AnimatedButton 
            href={inboxDetails.href} 
            target="_blank" 
            rel="noopener noreferrer" 
            theme="brand" 
            size="sm" 
            onClick={() => analytics.track('confirm_inbox_opened', { source, provider: inboxDetails.provider })}
          >
            {inboxDetails.label}
          </AnimatedButton>
        ) : (
          <span />
        )}
        
        {onChangeAddress ? (
          <button 
            type="button" 
            onClick={onChangeAddress} 
            className="text-body-sm text-foreground-muted underline underline-offset-4 transition-colors duration-(--duration-quick) hover:text-foreground"
          >
            Wrong address?
          </button>
        ) : null}
      </div>
    </div>
  );
}

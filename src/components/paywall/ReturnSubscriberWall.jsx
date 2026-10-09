import React, { useState } from 'react';
import { toast } from 'sonner';
import { Check } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import FreeChip from '@/components/ui/FreeChip';

function OnTheListChip() {
  return (
    <span className="text-accent-xs inline-flex h-24 items-center gap-6 border border-foreground/15 bg-background px-8 text-foreground-muted">
      <Check size={12} weight="bold" />
      On the list
    </span>
  );
}

export default function ReturnSubscriberWall({
  title = "this component",
  isInStarterPack = false,
  checkoutBlock = null,
  onResend = null
}) {
  let [status, setStatus] = useState("idle");

  async function handleResend() {
    setStatus("loading");
    try {
      let res;
      if (onResend) {
        res = await onResend();
      } else {
        let response = await fetch("/api/starter-pack/resend", {
          method: "POST"
        });
        
        let data = await response.json().catch(() => ({}));
        
        if (!response.ok) {
          throw new Error(data.error || "Could not resend");
        }
        res = data;
      }
      
      toast.success(res?.message || "Sent.");
      setStatus("done");
    } catch (err) {
      toast.error(err.message || "Could not resend. Reply to any of our emails and we sort it.");
      setStatus("idle");
    }
  }

  return (
    <div className="flex w-full max-w-[26rem] flex-col gap-20">
      <div className="flex flex-col items-center gap-10 text-center">
        {isInStarterPack ? <FreeChip /> : <OnTheListChip />}
        <p className="text-body font-medium text-foreground">
          {isInStarterPack ? `${title} is already yours.` : `The full code for ${title} is locked.`}
        </p>
        <p className="text-body-sm text-foreground-muted">
          {isInStarterPack
            ? "You're on the list, so the Starter Pack ZIP with this component is in your inbox, in React, Vue and HTML."
            : "You already get every free drop by email. The rest of the library is one subscription away."}
        </p>
      </div>
      
      {isInStarterPack && (
        <div className="flex flex-col items-center gap-8">
          <Button
            type="button"
            theme={status === "done" ? "surface" : "brand"}
            size="sm"
            loading={status === "loading"}
            disabled={status === "done"}
            onClick={handleResend}
          >
            {status === "done" ? "Sent, check your inbox" : "Resend the pack"}
          </Button>
          <p className="text-accent-xs text-foreground-muted">
            Can't find it? Check spam, or reply to any of our emails.
          </p>
        </div>
      )}
      
      {checkoutBlock && (
        <div className={isInStarterPack ? "mt-16 flex flex-col items-center border-t border-foreground/10 pt-32" : "flex flex-col items-center"}>
          {checkoutBlock}
        </div>
      )}
    </div>
  );
}

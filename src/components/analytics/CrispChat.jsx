import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { createClient } from '@/libs/supabase/client';
import siteConfig from '@/libs/config/siteConfig';

export function CrispChat() {
  const pathname = usePathname();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    })();
  }, []);

  useEffect(() => {
    if (userId && window.$crisp) {
      window.$crisp.push(['set', 'session:data', [[['userId', userId]]]]);
    }
  }, [userId]);

  useEffect(() => {
    if (!siteConfig?.crisp?.id) return;

    const timeoutId = setTimeout(() => {
      if (
        window.$crisp &&
        siteConfig.crisp.onlyShowOnRoutes &&
        !siteConfig.crisp.onlyShowOnRoutes.includes(pathname)
      ) {
        window.$crisp.push(['do', 'chat:hide']);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  if (!siteConfig?.crisp?.id) {
    return null;
  }

  return (
    <>
      <Script
        id="crisp-stub"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.$crisp=[];window.CRISP_WEBSITE_ID="${siteConfig.crisp.id}";
          `
        }}
      />
      <Script
        id="crisp-loader"
        strategy="afterInteractive"
        type="text/partytown"
        src="https://client.crisp.chat/l.js"
        async
      />
    </>
  );
}

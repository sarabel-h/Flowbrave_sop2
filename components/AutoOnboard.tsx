'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function AutoOnboard() {
  const { isSignedIn, user } = useUser();
  const [didRun, setDidRun] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user || didRun) return;

    const companyId = user.publicMetadata?.companyId as string | undefined;
    if (companyId) return; // déjà onboardé

    const raw = typeof window !== 'undefined' ? localStorage.getItem('onboardPayload') : null;
    if (!raw) return;

    const payload = JSON.parse(raw);
    if (!payload?.name || !payload?.role || !payload?.companySize) return;

    (async () => {
      try {
        const res = await fetch('/api/onboard', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          localStorage.removeItem('onboardPayload');
        }
      } catch (_e) {
        // silencieux (l'utilisateur peut réessayer plus tard)
      } finally {
        setDidRun(true);
      }
    })();
  }, [isSignedIn, user, didRun]);

  return null;
}

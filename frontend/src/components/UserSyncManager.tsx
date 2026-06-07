'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { API_BASE_URL, LOCAL_STORAGE_PREFIX } from '@/constants';

export const UserSyncManager = () => {
  const { user, isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return;

    const syncToken = `${user.id}_${user.imageUrl}_${user.primaryEmailAddress?.emailAddress || ''}_${user.firstName || ''}_${user.lastName || ''}_${(user.externalAccounts || []).length}`;
    const lastSyncedKey = `${LOCAL_STORAGE_PREFIX}_last_synced_user`;
    const lastSynced = sessionStorage.getItem(lastSyncedKey);
    if (lastSynced === syncToken) return;

    const email = user.primaryEmailAddress?.emailAddress || "";
    const auth_methods: string[] = [];
    if (user.emailAddresses && user.emailAddresses.length > 0) {
      auth_methods.push("email");
    }
    
    const external_accounts = (user.externalAccounts || []).map((acc) => {
      const provider = acc.provider ? acc.provider.toLowerCase() : "";
      if (provider) {
        auth_methods.push(provider);
      }
      return {
        provider,
        provider_user_id: String(acc.providerUserId),
        email_address: acc.emailAddress || null,
      };
    });

    const referredByKey = `${LOCAL_STORAGE_PREFIX}_referred_by`;
    const referredBy = localStorage.getItem(referredByKey);

    const payload = {
      clerk_id: user.id,
      email,
      first_name: user.firstName || null,
      last_name: user.lastName || null,
      image_url: user.imageUrl || null,
      auth_methods: Array.from(new Set(auth_methods)),
      external_accounts,
      referred_by: referredBy || null,
    };


    fetch(`${API_BASE_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem(lastSyncedKey, syncToken);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [user, isLoaded, isSignedIn]);

  return null;
};

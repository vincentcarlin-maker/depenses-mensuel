import { supabase } from './supabase/client';

const VAPID_PUBLIC_KEY = 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';
const VAPID_PRIVATE_KEY = 'g1sFLkHhpqVT5NOxZIIXMrUIBXHhOi90Rcd3VD9YZHo';

function base64UrlToBytes(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function stringToBase64Url(str: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  return bytesToBase64Url(bytes);
}

// Generate the VAPID WebPush Authorization header
async function generateVapidHeader(endpoint: string): Promise<string> {
  const aud = new URL(endpoint).origin;
  const exp = Math.floor(Date.now() / 1000) + 12 * 3600; // 12 hours validity

  const header = {
    alg: "ES256",
    typ: "JWT"
  };

  const payload = {
    aud,
    exp,
    sub: "mailto:vincent.carlin@sfr.fr"
  };

  const headerB64 = stringToBase64Url(JSON.stringify(header));
  const payloadB64 = stringToBase64Url(JSON.stringify(payload));
  const message = `${headerB64}.${payloadB64}`;

  // Decode key coordinates to build standard JWK JSON key for the browser
  const pubBytes = base64UrlToBytes(VAPID_PUBLIC_KEY);
  const xBytes = pubBytes.slice(1, 33);
  const yBytes = pubBytes.slice(33, 65);
  const xB64 = bytesToBase64Url(xBytes);
  const yB64 = bytesToBase64Url(yBytes);

  const jwkPrivate = {
    kty: "EC",
    crv: "P-256",
    x: xB64,
    y: yB64,
    d: VAPID_PRIVATE_KEY,
    ext: true
  };

  // Import EC Private Key via SubtleCrypto
  const privateKeyObj = await window.crypto.subtle.importKey(
    "jwk",
    jwkPrivate,
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    false,
    ["sign"]
  );

  // Sign with ES256
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(message);

  const signatureBuffer = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" }
    },
    privateKeyObj,
    messageBytes
  );

  const signatureBytes = new Uint8Array(signatureBuffer);
  const signatureB64 = bytesToBase64Url(signatureBytes);

  return `${message}.${signatureB64}`;
}

/**
 * Triggers a Web Push notification directly from the client's browser using standard Web Push protocols.
 * Since encrypting payloads client-side in JS requires complex cryptography, we send an empty body.
 * The Service Worker picks it up, fetches the latest transaction details directly from Supabase, and presents it.
 */
export async function notifySubscriptionsDirectly(
  currentUser: string, 
  notificationData?: any
): Promise<{ success: boolean; count: number }> {
  try {
    // Normalize notificationData (can be a standard expense object or structured notification payload)
    let type: 'add' | 'delete' | 'update' | 'moneypot' = 'add';
    let expense: any = null;

    if (notificationData) {
      if (notificationData.type && ['add', 'delete', 'update', 'moneypot'].includes(notificationData.type)) {
        type = notificationData.type;
        expense = notificationData.expense;
      } else {
        // Simple fallback
        expense = notificationData;
        type = 'add';
      }
    }

    // 1. Get subscriptions from Supabase
    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      console.error("Error reading subscriptions from Supabase:", error);
      throw error;
    }

    const subscriptionsList = (data as any[]) || [];

    if (subscriptionsList.length === 0) {
      console.log("No registered subscriptions to notify.");
      return { success: true, count: 0 };
    }

    // 2. Filter out current user's own subscription so they don't notify themselves
    const otherSubscriptions = subscriptionsList.filter(sub => sub.user_id !== currentUser);

    if (otherSubscriptions.length === 0) {
      console.log("No subscriptions for other users found to notify.");
      return { success: true, count: 0 };
    }

    console.log(`Sending browser-direct push alerts to ${otherSubscriptions.length} receivers...`);
    let sentCount = 0;

    for (const subItem of otherSubscriptions) {
      try {
        const sub = typeof subItem.subscription === 'string' 
          ? JSON.parse(subItem.subscription) 
          : subItem.subscription;

        if (!sub || !sub.endpoint) continue;

        // Apply notification preference filters if specified
        if (sub.preferences) {
          const prefs = sub.preferences;

          // A. Quiet Hours Filter (Heures de Silence)
          if (prefs.quietHoursActive && prefs.quietHoursStart && prefs.quietHoursEnd) {
            const now = new Date();
            const currentHours = now.getHours();
            const currentMinutes = now.getMinutes();
            const currentTotalMinutes = currentHours * 60 + currentMinutes;

            const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
            const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
            const startTotalMinutes = startH * 60 + startM;
            const endTotalMinutes = endH * 60 + endM;

            let isInQuietHours = false;
            if (startTotalMinutes <= endTotalMinutes) {
              isInQuietHours = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes <= endTotalMinutes;
            } else {
              isInQuietHours = currentTotalMinutes >= startTotalMinutes || currentTotalMinutes <= endTotalMinutes;
            }

            if (isInQuietHours) {
              console.log(`Direct push ignored for ${subItem.user_id}: Quiet hours are active (${prefs.quietHoursStart} - ${prefs.quietHoursEnd})`);
              continue;
            }
          }

          // B. Suppressions Filter
          if (type === 'delete' && prefs.includeDeletes === false) {
            console.log(`Direct push ignored for ${subItem.user_id}: deletion alerts disabled.`);
            continue;
          }

          // C. Money Pot Filter
          const isCategoryCagnotte = expense && (expense.category === 'Cagnotte' || expense.category === 'Cagnotte commune');
          if ((type === 'moneypot' || isCategoryCagnotte) && prefs.includeMoneyPot === false) {
            console.log(`Direct push ignored for ${subItem.user_id}: money pot alerts disabled.`);
            continue;
          }

          // D. Author filter (only for expenses)
          if (expense && (type === 'add' || type === 'update' || type === 'delete')) {
            if (prefs.authors && Array.isArray(prefs.authors)) {
              if (!prefs.authors.includes(expense.user)) {
                console.log(`Direct push filtered for user ${subItem.user_id} based on author preference.`);
                continue;
              }
            }
          }

          // E. Amount filter (only for creation / updates of expenses)
          if (expense && (type === 'add' || type === 'update')) {
            if (typeof prefs.minAmount === 'number') {
              if (expense.amount < prefs.minAmount) {
                console.log(`Direct push filtered for user ${subItem.user_id} because expense amount is smaller than min amount.`);
                continue;
              }
            }
          }

          // F. Category/motive filters
          if (expense && (type === 'add' || type === 'update')) {
            if (prefs.categories && Array.isArray(prefs.categories)) {
              if (!prefs.categories.includes(expense.category)) {
                console.log(`Direct push filtered for user ${subItem.user_id} because ${expense.category} is deselected.`);
                continue;
              }
            }
          }
        }

        const token = await generateVapidHeader(sub.endpoint);

        // Call the Web Push endpoint directly from the browser!
        // Push-service endpoints accept CORS from all origins.
        const response = await fetch(sub.endpoint, {
          method: 'POST',
          headers: {
            'TTL': '86400', // Time To Live: 24 hours
            'Urgency': 'high',
            'Authorization': `WebPush ${token}`,
            'Crypto-Key': `p256ecdsa=${VAPID_PUBLIC_KEY}` // Backwards compatibility for older browsers
          },
          body: null // Sending an empty body avoids payload encryption & works with service workers
        });

        if (response.ok || response.status === 201) {
          console.log(`Direct push notification sent to user ${subItem.user_id}`);
          sentCount++;
        } else if (response.status === 410 || response.status === 404) {
          // Clean up expired subscriptions automatically
          console.log(`Expired push subscription for ${subItem.user_id}. Cleaning up...`);
          await supabase.from('push_subscriptions').delete().eq('user_id', subItem.user_id);
        } else {
          console.error(`Error sending direct push to ${subItem.user_id}. Status: ${response.status}`);
        }
      } catch (err) {
        console.error(`Failed to dispatch direct push for subscription:`, err);
      }
    }

    return { success: true, count: sentCount };
  } catch (error) {
    console.error("Direct browser dispatch error:", error);
    return { success: false, count: 0 };
  }
}

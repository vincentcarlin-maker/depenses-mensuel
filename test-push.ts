import webpush from "web-push";

const VAPID_PUBLIC_KEY = 'BN0Z3nqz3OLK1q2RuvukfLMAffOncCrBsvMw7GncY_9EK8u6-W0OzfIsRElejTlC-TM2uNDXCZkicnJX47pNGdc';
const VAPID_PRIVATE_KEY = 'g1sFLkHhpqVT5NOxZIIXMrUIBXHhOi90Rcd3VD9YZHo';
webpush.setVapidDetails(
    'mailto:vincent.carlin@sfr.fr',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
);

async function testPush() {
    const subscription = {
      "keys": {
        "auth": "IuU63fUwjIlOB-7UCcCXLQ",
        "p256dh": "BCex7sQsfBF3lZHrMOKOwEUNnTZE5cBGOgQMDc76sjdYQaxJ4AlYZtmA8NF-RgyZzsbQADOq8PcnQKc90CS-3jg"
      },
      "endpoint": "https://web.push.apple.com/QACeW7CRaKsJmv-Vj3IP-zWT_mBQjzFsr-Msbl8BCdNOvAX4dTWmxszL5Okeqht9PCq_PN76zUik2JdWVtRyz-kvxc-KGxh1iDt0aTVf5IES4_I8QhRI4kLqEBv7wuXMhu7aQiMc1m9W2LZuLUA7F4TPPMDio9D2hMUXno9f39w"
    };

    const payload = JSON.stringify({
        title: 'Push Test System',
        body: 'Ceci est un test direct depuis le backend',
        icon: '/icon-192x192.png'
    });

    try {
        console.log("Sending push...");
        const result = await webpush.sendNotification(subscription, payload);
        console.log("Success:", result);
    } catch (e) {
        console.error("Failed:", e);
    }
}

testPush();

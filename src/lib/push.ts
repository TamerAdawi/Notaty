// Web Push: ask permission, subscribe with our VAPID key, store the subscription.
import { savePushSubscription } from './db';

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export function pushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function notifPermission(): NotificationPermission | 'unsupported' {
  if (!pushSupported()) return 'unsupported';
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export async function enablePush(): Promise<{ ok: boolean; message: string }> {
  if (!pushSupported()) {
    return {
      ok: false,
      message:
        'This browser cannot receive notifications. On iPhone, add Notaty to your Home Screen and open it from there first.',
    };
  }
  if (!VAPID_PUBLIC) {
    return { ok: false, message: 'Server not fully configured (missing VAPID public key).' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { ok: false, message: 'Notification permission was not granted.' };
  }

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as unknown as BufferSource,
    });
  }
  const json = sub.toJSON();
  await savePushSubscription({
    endpoint: sub.endpoint,
    p256dh: json.keys?.p256dh ?? '',
    auth: json.keys?.auth ?? '',
  });
  return { ok: true, message: 'Notifications enabled on this device. 🔔' };
}

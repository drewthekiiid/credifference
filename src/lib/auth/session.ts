import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import type { StoredPasskeyDevice } from '@/types/ssot';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-for-local-dev-only-change-in-prod'
);

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();

  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

export async function setChallengeCookie(challenge: string) {
  const token = await new SignJWT({ challenge })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();

  cookieStore.set('webauthn_challenge', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 5, // 5 minutes
  });
}

export async function getChallengeCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get('webauthn_challenge')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload.challenge as string;
  } catch {
    return null;
  }
}

export async function clearChallengeCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('webauthn_challenge');
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function setRegisteredDevices(devices: StoredPasskeyDevice[]) {
  const token = await new SignJWT({ devices })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('365d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();

  cookieStore.set('passkey_devices', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getRegisteredDevices(): Promise<StoredPasskeyDevice[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get('passkey_devices')?.value;

  if (!token) {
    return [];
  }

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const rawDevices = payload.devices;

    if (!Array.isArray(rawDevices)) {
      return [];
    }

    return rawDevices.filter((device): device is StoredPasskeyDevice => {
      if (!device || typeof device !== 'object') {
        return false;
      }

      const candidate = device as Partial<StoredPasskeyDevice>;
      return (
        typeof candidate.credentialID === 'string' &&
        typeof candidate.credentialPublicKey === 'string' &&
        typeof candidate.counter === 'number' &&
        typeof candidate.credentialDeviceType === 'string' &&
        typeof candidate.credentialBackedUp === 'boolean'
      );
    });
  } catch {
    return [];
  }
}

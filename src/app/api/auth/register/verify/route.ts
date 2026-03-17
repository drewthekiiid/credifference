import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import {
  clearChallengeCookie,
  createSession,
  getChallengeCookie,
  getRegisteredDevices,
  setRegisteredDevices,
} from '@/lib/auth/session';
import { getExpectedOrigin, getRpId } from '@/lib/auth/webauthn';
import type { StoredPasskeyDevice } from '@/types/ssot';

const userId = 'user-drew-123';

export async function POST(req: Request) {
  const rpID = getRpId(req);
  const expectedOrigin = getExpectedOrigin(req);
  const body = await req.json();
  const expectedChallenge = await getChallengeCookie();

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
    });

    if (verification.verified && verification.registrationInfo) {
      const {
        credential,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      const newDevice: StoredPasskeyDevice = {
        credentialID: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey).toString('base64url'),
        counter: credential.counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: Array.isArray(body.response?.transports)
          ? body.response.transports.filter(
              (transport: unknown): transport is string => typeof transport === 'string'
            )
          : undefined,
      };

      const devices = await getRegisteredDevices();
      const nextDevices = devices.filter((device) => device.credentialID !== newDevice.credentialID);
      nextDevices.push(newDevice);

      await setRegisteredDevices(nextDevices);
      await clearChallengeCookie();
      await createSession(userId);

      return NextResponse.json({ verified: true });
    }
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Registration verification failed' },
      { status: 400 }
    );
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}

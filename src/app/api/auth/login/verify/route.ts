import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import {
  clearChallengeCookie,
  createSession,
  getChallengeCookie,
  getRegisteredDevices,
} from '@/lib/auth/session';
import { getExpectedOrigin, getRpId } from '@/lib/auth/webauthn';

const userId = 'user-drew-123';

export async function POST(req: Request) {
  const rpID = getRpId(req);
  const expectedOrigin = getExpectedOrigin(req);
  const body = await req.json();
  const expectedChallenge = await getChallengeCookie();

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 });
  }

  const devices = await getRegisteredDevices();
  const device = devices.find((d) => d.credentialID === body.id);

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      credential: {
        id: device.credentialID,
        publicKey: Buffer.from(device.credentialPublicKey, 'base64url'),
        counter: device.counter,
      },
    });

    if (verification.verified) {
      await clearChallengeCookie();
      await createSession(userId);
      return NextResponse.json({ verified: true });
    }
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Authentication failed' },
      { status: 400 }
    );
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}

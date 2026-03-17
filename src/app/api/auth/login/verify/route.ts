import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getChallengeCookie, clearChallengeCookie, createSession } from '@/lib/auth/session';
import passkeysData from '@/data/passkeys.json';

const rpID = process.env.RP_ID || 'localhost';
const expectedOrigin = process.env.EXPECTED_ORIGIN || 'http://localhost:3000';

export async function POST(req: Request) {
  const body = await req.json();
  const expectedChallenge = await getChallengeCookie();

  if (!expectedChallenge) {
    return NextResponse.json({ error: 'Challenge expired or missing' }, { status: 400 });
  }

  const user = passkeysData.users.drew;
  const device = user.devices.find((d) => d.credentialID === body.id);

  if (!device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: Buffer.from(device.credentialID, 'base64url'),
        credentialPublicKey: Buffer.from(device.credentialPublicKey, 'base64url'),
        counter: device.counter,
      },
    });

    if (verification.verified) {
      // In a real app we'd update the counter in DB, but since it's read-only in prod, we skip it
      await clearChallengeCookie();
      await createSession(user.id);
      return NextResponse.json({ verified: true });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}

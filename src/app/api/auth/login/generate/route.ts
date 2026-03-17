import { generateAuthenticationOptions } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/types';
import { NextResponse } from 'next/server';
import { setChallengeCookie } from '@/lib/auth/session';
import passkeysData from '@/data/passkeys.json';

const rpID = process.env.RP_ID || 'localhost';

export async function GET() {
  const user = passkeysData.users.drew;

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.devices.map((dev) => ({
      id: Buffer.from(dev.credentialID, 'base64url'),
      type: 'public-key',
      transports: dev.transports as AuthenticatorTransportFuture[],
    })),
    userVerification: 'preferred',
  });

  await setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}

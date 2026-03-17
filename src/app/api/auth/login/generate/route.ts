import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { setChallengeCookie } from '@/lib/auth/session';
import passkeysData from '@/data/passkeys.json';
import type { PasskeysData } from '@/types/ssot';

const rpID = process.env.RP_ID || 'localhost';

export async function GET() {
  const user = (passkeysData as PasskeysData).users.drew;

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: user.devices.map((dev) => ({
      id: dev.credentialID,
    })),
    userVerification: 'preferred',
  });

  await setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}

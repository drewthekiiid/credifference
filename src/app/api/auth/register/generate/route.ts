import { generateRegistrationOptions } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { setChallengeCookie } from '@/lib/auth/session';
import passkeysData from '@/data/passkeys.json';

const rpName = 'Drew SSOT';
const rpID = process.env.RP_ID || 'localhost';

export async function GET() {
  // Only allow registration in development mode to prevent unauthorized registrations in prod
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Registration disabled in production' }, { status: 403 });
  }

  const user = passkeysData.users.drew;

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(user.id),
    userName: user.username,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}

import { generateRegistrationOptions } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getRegisteredDevices, setChallengeCookie } from '@/lib/auth/session';

const rpName = 'Drew SSOT';
const rpID = process.env.RP_ID || 'localhost';
const userId = 'user-drew-123';
const userName = 'drew';

export async function GET() {
  const devices = await getRegisteredDevices();

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(userId),
    userName,
    attestationType: 'none',
    excludeCredentials: devices.map((device) => ({
      id: device.credentialID,
    })),
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
    },
  });

  await setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}

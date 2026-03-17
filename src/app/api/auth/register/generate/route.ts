import { generateRegistrationOptions } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getRegisteredDevices, setChallengeCookie } from '@/lib/auth/session';
import { getRpId } from '@/lib/auth/webauthn';

const rpName = 'Drew SSOT';
const userId = 'user-drew-123';
const userName = 'drew';

export async function GET(request: Request) {
  const devices = await getRegisteredDevices();
  const rpID = getRpId(request);

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

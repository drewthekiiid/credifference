import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getRegisteredDevices, setChallengeCookie } from '@/lib/auth/session';
import { getRpId } from '@/lib/auth/webauthn';

export async function GET(request: Request) {
  const devices = await getRegisteredDevices();
  const rpID = getRpId(request);

  if (devices.length === 0) {
    return NextResponse.json(
      { error: 'No registered passkey found. Register this device first.' },
      { status: 400 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials: devices.map((dev) => ({
      id: dev.credentialID,
    })),
    userVerification: 'preferred',
  });

  await setChallengeCookie(options.challenge);

  return NextResponse.json(options);
}

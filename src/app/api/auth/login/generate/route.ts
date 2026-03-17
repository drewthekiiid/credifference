import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getRegisteredDevices, setChallengeCookie } from '@/lib/auth/session';

const rpID = process.env.RP_ID || 'localhost';

export async function GET() {
  const devices = await getRegisteredDevices();

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

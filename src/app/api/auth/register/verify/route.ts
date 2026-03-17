import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getChallengeCookie, clearChallengeCookie } from '@/lib/auth/session';
import passkeysData from '@/data/passkeys.json';
import fs from 'fs/promises';
import path from 'path';
import type { PasskeysData, StoredPasskeyDevice } from '@/types/ssot';

const rpID = process.env.RP_ID || 'localhost';
const expectedOrigin = process.env.EXPECTED_ORIGIN || 'http://localhost:3000';

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Registration disabled in production' }, { status: 403 });
  }

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

      // Save the new device to the local passkeys.json file
      const user = (passkeysData as PasskeysData).users.drew;
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

      user.devices.push(newDevice);

      // Write back to file
      const filePath = path.join(process.cwd(), 'src/data/passkeys.json');
      await fs.writeFile(filePath, JSON.stringify(passkeysData, null, 2));

      await clearChallengeCookie();

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

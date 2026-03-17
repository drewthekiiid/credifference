import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextResponse } from 'next/server';
import { getChallengeCookie, clearChallengeCookie } from '@/lib/auth/session';
import passkeysData from '@/data/passkeys.json';
import fs from 'fs/promises';
import path from 'path';

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
      const { credentialID, credentialPublicKey, counter, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      // Save the new device to the local passkeys.json file
      const user = passkeysData.users.drew;
      const newDevice = {
        credentialID: Buffer.from(credentialID).toString('base64url'),
        credentialPublicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports: body.response.transports,
      };

      user.devices.push(newDevice as any);

      // Write back to file
      const filePath = path.join(process.cwd(), 'src/data/passkeys.json');
      await fs.writeFile(filePath, JSON.stringify(passkeysData, null, 2));

      await clearChallengeCookie();

      return NextResponse.json({ verified: true });
    }
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ verified: false }, { status: 400 });
}

export function getRpId(request: Request) {
  if (process.env.RP_ID) {
    return process.env.RP_ID;
  }

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000';

  return host.split(':')[0];
}

export function getExpectedOrigin(request: Request) {
  if (process.env.EXPECTED_ORIGIN) {
    return process.env.EXPECTED_ORIGIN;
  }

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    'localhost:3000';

  const protocol =
    request.headers.get('x-forwarded-proto') ||
    (host.startsWith('localhost') ? 'http' : 'https');

  return `${protocol}://${host}`;
}

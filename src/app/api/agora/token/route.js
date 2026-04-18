import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const channelName = searchParams.get('channelName');
  const uid = searchParams.get('uid');

  if (!channelName) {
    return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
  }

  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json({ error: 'Agora credentials not configured' }, { status: 500 });
  }

  // Convert Firebase UID string to a numeric UID Agora accepts (same logic as client)
  const numericUid = uid
    ? Math.abs(uid.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)) % 1000000
    : 0;

  const role = RtcRole.PUBLISHER;
  const expirationTimeInSeconds = 3600; // 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      numericUid,
      role,
      privilegeExpiredTs
    );

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Token Generation Error:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}

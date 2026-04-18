import AgoraRTC from 'agora-rtc-sdk-ng';

// ─── Agora App ID ────────────────────────────────────────────────────────────
// Set NEXT_PUBLIC_AGORA_APP_ID in your .env.local
export const AGORA_APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || '';

// ─── Shared Client Instance ───────────────────────────────────────────────────
let client = null;

export function getAgoraClient() {
  if (!client) {
    client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
  }
  return client;
}

/**
 * Join an Agora channel.
 * @param {string} channelName  - unique channel ID (use sessionId)
 * @param {string|null} token   - Agora token (null = no-auth for dev)
 * @param {string|null} uid     - user UID string (converted to number hash)
 * @returns {{ localAudioTrack, localVideoTrack }}
 */
export async function joinChannel(channelName, token = null, uid = null) {
  const rtcClient = getAgoraClient();

  // Convert Firebase UID string to a numeric UID Agora accepts
  const numericUid = uid
    ? Math.abs(uid.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)) % 1000000
    : null;

  await rtcClient.join(AGORA_APP_ID, channelName, token, numericUid);

  const [localAudioTrack, localVideoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
  await rtcClient.publish([localAudioTrack, localVideoTrack]);

  return { localAudioTrack, localVideoTrack };
}

/**
 * Join an Agora channel in audio-only mode.
 */
export async function joinChannelAudioOnly(channelName, token = null, uid = null) {
  const rtcClient = getAgoraClient();

  const numericUid = uid
    ? Math.abs(uid.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 0)) % 1000000
    : null;

  await rtcClient.join(AGORA_APP_ID, channelName, token, numericUid);

  const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  await rtcClient.publish([localAudioTrack]);

  return { localAudioTrack, localVideoTrack: null };
}

/**
 * Leave the channel and stop all local tracks.
 */
export async function leaveChannel(localAudioTrack, localVideoTrack) {
  const rtcClient = getAgoraClient();

  if (localAudioTrack) {
    localAudioTrack.stop();
    localAudioTrack.close();
  }
  if (localVideoTrack) {
    localVideoTrack.stop();
    localVideoTrack.close();
  }

  await rtcClient.leave();
  client = null; // reset so a fresh client is created on next join
}

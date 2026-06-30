import { supabase } from "@/integrations/supabase/client";

const LOCAL_KEY_PREFIX = "afriteach:e2ee:keypair:";
const KEY_ALGORITHM = "ECDH-P-256";
const ENCRYPTION_VERSION = "e2ee-v1";

export interface DecryptedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
  encrypted: boolean;
}

interface StoredKeyPair {
  publicKeyJwk: JsonWebKey;
  privateKeyJwk: JsonWebKey;
}

interface EncryptedPayload {
  v: 1;
  alg: "ECDH-P-256+HKDF-SHA-256+AES-GCM";
  iv: string;
  ciphertext: string;
  senderPublicKey: JsonWebKey;
  recipientPublicKey: JsonWebKey;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (buffer: ArrayBuffer | Uint8Array) => {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
};

const fromBase64 = (value: string) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

const getLocalKeyName = (userId: string) => `${LOCAL_KEY_PREFIX}${userId}`;

const exportKeyPair = async (keyPair: CryptoKeyPair): Promise<StoredKeyPair> => ({
  publicKeyJwk: await crypto.subtle.exportKey("jwk", keyPair.publicKey),
  privateKeyJwk: await crypto.subtle.exportKey("jwk", keyPair.privateKey),
});

const generateLocalKeyPair = async (): Promise<StoredKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );

  return exportKeyPair(keyPair);
};

export const ensureMessageEncryptionKey = async (userId: string) => {
  const localKeyName = getLocalKeyName(userId);
  const existing = localStorage.getItem(localKeyName);
  const keyPair: StoredKeyPair = existing ? JSON.parse(existing) : await generateLocalKeyPair();

  if (!existing) {
    localStorage.setItem(localKeyName, JSON.stringify(keyPair));
  }

  const { error } = await supabase
    .from("message_encryption_keys")
    .upsert({
      user_id: userId,
      public_key_jwk: keyPair.publicKeyJwk,
      key_algorithm: KEY_ALGORITHM,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) {
    throw error;
  }

  return keyPair;
};

const getLocalKeyPair = async (userId: string) => ensureMessageEncryptionKey(userId);

const getPublicKeyForUser = async (userId: string): Promise<JsonWebKey> => {
  const { data, error } = await supabase
    .from("message_encryption_keys")
    .select("public_key_jwk")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.public_key_jwk) {
    throw new Error("This contact has not opened messages yet, so their encryption key is not ready.");
  }

  return data.public_key_jwk as JsonWebKey;
};

const importPrivateKey = (privateKeyJwk: JsonWebKey) =>
  crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    ["deriveBits"]
  );

const importPublicKey = (publicKeyJwk: JsonWebKey) =>
  crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

const deriveConversationKey = async (
  privateKeyJwk: JsonWebKey,
  publicKeyJwk: JsonWebKey,
  userA: string,
  userB: string
) => {
  const privateKey = await importPrivateKey(privateKeyJwk);
  const publicKey = await importPublicKey(publicKeyJwk);
  const sharedSecret = await crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256
  );

  const hkdfKey = await crypto.subtle.importKey("raw", sharedSecret, "HKDF", false, ["deriveKey"]);
  const sortedParticipants = [userA, userB].sort().join(":");

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: textEncoder.encode(`afriteach-messages:${sortedParticipants}`),
      info: textEncoder.encode(ENCRYPTION_VERSION),
    },
    hkdfKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptText = async (senderId: string, receiverId: string, text: string) => {
  const senderKeyPair = await getLocalKeyPair(senderId);
  const recipientPublicKey = await getPublicKeyForUser(receiverId);
  const aesKey = await deriveConversationKey(
    senderKeyPair.privateKeyJwk,
    recipientPublicKey,
    senderId,
    receiverId
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    textEncoder.encode(text)
  );

  const payload: EncryptedPayload = {
    v: 1,
    alg: "ECDH-P-256+HKDF-SHA-256+AES-GCM",
    iv: toBase64(iv),
    ciphertext: toBase64(ciphertext),
    senderPublicKey: senderKeyPair.publicKeyJwk,
    recipientPublicKey,
  };

  return payload;
};

const decryptText = async (
  currentUserId: string,
  senderId: string,
  receiverId: string,
  payload: EncryptedPayload
) => {
  const localKeyPair = await getLocalKeyPair(currentUserId);
  const otherPublicKey = currentUserId === senderId
    ? payload.recipientPublicKey
    : payload.senderPublicKey;

  const aesKey = await deriveConversationKey(
    localKeyPair.privateKeyJwk,
    otherPublicKey,
    senderId,
    receiverId
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    aesKey,
    fromBase64(payload.ciphertext)
  );

  return textDecoder.decode(plaintext);
};

export const fetchConversationMessages = async (
  currentUserId: string,
  contactId: string
): Promise<DecryptedMessage[]> => {
  await ensureMessageEncryptionKey(currentUserId);

  const { data, error } = await supabase
    .from("messages")
    .select("id, sender_id, receiver_id, message_text, sent_at, read_at, encrypted_payload, encryption_version")
    .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${currentUserId})`)
    .order("sent_at", { ascending: true });

  if (error) throw error;

  return Promise.all((data || []).map(async row => {
    let text = row.message_text || "";
    let encrypted = false;

    if (row.encryption_version === ENCRYPTION_VERSION && row.encrypted_payload) {
      encrypted = true;
      try {
        text = await decryptText(
          currentUserId,
          row.sender_id,
          row.receiver_id,
          row.encrypted_payload as EncryptedPayload
        );
      } catch (error) {
        console.error("Failed to decrypt message", row.id, error);
        text = "Unable to decrypt this message on this device.";
      }
    }

    return {
      id: row.id,
      senderId: row.sender_id,
      receiverId: row.receiver_id,
      text,
      timestamp: row.sent_at,
      isRead: Boolean(row.read_at),
      encrypted,
    };
  }));
};

export const sendEncryptedMessage = async (
  senderId: string,
  receiverId: string,
  text: string
): Promise<DecryptedMessage> => {
  const encryptedPayload = await encryptText(senderId, receiverId, text);
  const sentAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      message_text: "[Encrypted message]",
      encrypted_payload: encryptedPayload,
      encryption_version: ENCRYPTION_VERSION,
      sent_at: sentAt,
    })
    .select("id, sender_id, receiver_id, sent_at, read_at")
    .single();

  if (error) throw error;

  return {
    id: data.id,
    senderId: data.sender_id,
    receiverId: data.receiver_id,
    text,
    timestamp: data.sent_at,
    isRead: Boolean(data.read_at),
    encrypted: true,
  };
};

export const markConversationAsRead = async (currentUserId: string, contactId: string) => {
  const { error } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("receiver_id", currentUserId)
    .eq("sender_id", contactId)
    .is("read_at", null);

  if (error) throw error;
};

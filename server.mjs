import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import QRCode from 'qrcode';
import bs58check from 'bs58check';
import { LoginConsentRequest, Context, IDENTITY_VIEW, LOGIN_CONSENT_WEBHOOK_VDXF_KEY, GenericRequest, GenericResponse, AppEncryptionRequestDetails, AppEncryptionRequestOrdinalVDXFObject, AppEncryptionResponseDetails, AppEncryptionResponseOrdinalVDXFObject, RequestURI, CompactIAddressObject } from 'verus-typescript-primitives';
import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const IdentitySignature = _require('@bitgo/utxo-lib/dist/src/identity_signature.js');
const ECPairLib = _require('@bitgo/utxo-lib/dist/src/ecpair');
const { networks } = _require('@bitgo/utxo-lib');
const BigInteger = _require('bigi');

dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const dataDir = path.join(__dirname, 'data');
const subscribersFile = path.join(dataDir, 'verus-subscribers.json');
const inboxFile = path.join(dataDir, 'verus-inbox.json');
const inboxIndexFile = path.join(dataDir, 'verus-inbox-index.json');

const rpcUrl = process.env.VERUS_RPC_URL || 'http://127.0.0.1:27486';
const rpcUser = process.env.VERUS_RPC_USER || '';
const rpcPassword = process.env.VERUS_RPC_PASSWORD || '';
const verusChain = process.env.VERUS_CHAIN || 'VRSCTEST';

const normalizeVerusId = (value) => value.trim().replace(/\s+/g, '');
const isValidVerusId = (value) => /^(i[a-zA-Z0-9]{20,}|[A-Za-z0-9._-]+@)$/.test(value);

const readJson = async (file, fallback) => {
  try {
    const contents = await fs.readFile(file, 'utf8');
    return JSON.parse(contents);
  } catch (error) {
    if (error && error.code === 'ENOENT') return fallback;
    throw error;
  }
};

const writeJson = async (file, value) => {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
};

const rpcCall = async (method, params = []) => {
  const headers = { 'Content-Type': 'application/json' };

  if (rpcUser || rpcPassword) {
    headers.Authorization = `Basic ${Buffer.from(`${rpcUser}:${rpcPassword}`).toString('base64')}`;
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      jsonrpc: '1.0',
      id: 'coming-soon-verus',
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`verusd RPC returned HTTP ${response.status}`);
  }

  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    const text = await response.text().catch(() => '');
    throw new Error(`verusd RPC returned invalid JSON: ${text || (error instanceof Error ? error.message : 'unknown error')}`);
  }

  if (payload.error) {
    throw new Error(payload.error.message || 'verusd RPC error');
  }

  return payload.result;
};

const verifyVerusId = async (verusId) => {
  try {
    const result = await rpcCall('getidentity', [verusId]);
    return {
      verified: true,
      identity: result,
    };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unable to verify VerusID against verusd',
    };
  }
};

const loadSubscribers = () => readJson(subscribersFile, []);
const loadInbox = () => readJson(inboxFile, []);
const loadInboxIndex = () => readJson(inboxIndexFile, []);
const inboxChallenges = new Map();
const pendingDecryptRequests = new Map();
const sessionIvkStore = new Map();

const CALLBACK_BASE_URL = process.env.CALLBACK_BASE_URL || `http://localhost:${port}`;
const TESTNET_REQUEST_CURRENCY_ID = 'iJhCezBExJHvtyH3fGhNnt2NhU4Ztkf2yq';

const encodeCompactSize = (value) => {
  if (value < 253) {
    return Buffer.from([value]);
  }

  const buffer = Buffer.alloc(3);
  buffer[0] = 253;
  buffer.writeUInt16LE(value, 1);
  return buffer;
};

const encodeVarInt = (value) => encodeCompactSize(value);

const encodeVarSlice = (buffer) => Buffer.concat([encodeCompactSize(buffer.length), buffer]);

const decodeBase58CheckPayload = (value) => {
  try {
    const payload = bs58check.decode(value);
    return payload.length > 20 ? payload.slice(payload.length - 20) : payload;
  } catch (error) {
    throw new Error(`Invalid base58check value "${value}": ${error instanceof Error ? error.message : 'unknown error'}`);
  }
};

const resolveIAddress = async (value) => {
  if (/^i[a-zA-Z0-9]{20,}$/.test(value)) {
    return value;
  }

  const result = await rpcCall('getidentity', [value]);
  const resolved = result?.identity?.identityaddress || result?.identityaddress;

  if (!resolved) {
    throw new Error(`Unable to resolve VerusID ${value}`);
  }

  return resolved;
};

const buildVerusPayInvoiceRequest = async ({ recipientVerusId, subject, body }) => {
  const recipientIAddress = await resolveIAddress(recipientVerusId);
  const destinationBytes = decodeBase58CheckPayload(recipientIAddress);
  const currencyBytes = decodeBase58CheckPayload(TESTNET_REQUEST_CURRENCY_ID);

  const flags = 1 + 8 + 128;

  const invoiceBuffer = Buffer.concat([
    encodeCompactSize(flags),
    Buffer.from([4]),
    encodeVarSlice(destinationBytes),
    currencyBytes,
  ]);

  const ordinalBuffer = Buffer.concat([
    encodeCompactSize(1),
    encodeVarInt(1),
    encodeVarSlice(invoiceBuffer),
  ]);

  const requestBuffer = Buffer.concat([
    encodeCompactSize(1),
    encodeCompactSize(16),
    ordinalBuffer,
  ]);

  const requestUri = `verus://1/${requestBuffer.toString('base64url')}`;
  const qrDataUrl = await QRCode.toDataURL(requestUri, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 6,
  });

  return {
    recipientVerusId,
    recipientIAddress,
    subject,
    body,
    requestUri,
    qrDataUrl,
  };
};

const getWalletSigningIdentity = async () => {
  let identities;
  try {
    identities = await rpcCall('listidentities', []);
  } catch (error) {
    throw new Error(`listidentities failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  const signer = identities?.find((entry) => entry?.cansignfor)?.identity || identities?.[0]?.identity;

  if (!signer?.identityaddress) {
    throw new Error('No wallet identity available for message signing');
  }

  return signer;
};

const pollOperation = async (operationId) => {
  for (let i = 0; i < 60; i += 1) {
    const result = await rpcCall('z_getoperationstatus', [operationId]);
    const op = Array.isArray(result) ? result[0] : result;
    if (!op) break;
    if (op.status === 'success' && op.result?.txid) return op.result.txid;
    if (op.status === 'failed') throw new Error(op.error?.message || 'Operation failed');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error('Timed out waiting for z operation');
};

const zGetEncryptionAddress = async (identity1, identity2) => {
  const result = await rpcCall('z_getencryptionaddress', [identity1, identity2]);
  return {
    zaddress: result?.zaddress || result?.address || '',
    ivk: result?.ivk || result?.incomingviewingkey || '',
  };
};

const getSpendableSourceAddress = async (identityAddress) => {
  try {
    const identity = await rpcCall('getidentity', [identityAddress]);
    const primary = identity?.identity?.primaryaddresses?.[0];
    if (primary) return primary;
  } catch {
    // fall through
  }
  const unspent = await rpcCall('listunspent', []);
  const spendable = Array.isArray(unspent) ? unspent.find((item) => item?.spendable && item?.address) : null;
  return spendable?.address || identityAddress;
};

const sendEncryptedBroadcast = async (fromIdentity, recipientAddress, subject, body, extra = {}) => {
  const payload = {
    subject,
    body,
    createdAt: new Date().toISOString(),
    ...extra,
  };

  const sourceAddress = await getSpendableSourceAddress(fromIdentity);

  const operationId = await rpcCall('sendcurrency', [
    sourceAddress,
    JSON.stringify([{
      currency: verusChain,
      address: recipientAddress,
      amount: 0.0001,
      data: { message: JSON.stringify(payload) },
    }]),
  ]);

  const txid = await pollOperation(operationId);
  return { operationId, txid, payload };
};

const listReceivedNotes = async (address) => {
  const result = await rpcCall('z_listreceivedbyaddress', [address]);
  return Array.isArray(result) ? result : [];
};

const decryptReceivedData = async (txid, datadescriptor, evk) => {
  return rpcCall('decryptdata', [{
    datadescriptor,
    txid,
    retrieve: true,
    evk,
  }]);
};

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    chain: verusChain,
    rpcConfigured: true,
  });
});

app.get('/api/verus/subscribers', async (_req, res, next) => {
  try {
    const subscribers = await loadSubscribers();
    res.json({ subscribers });
  } catch (error) {
    next(error);
  }
});

app.post('/api/verus/subscribe', async (req, res, next) => {
  try {
    const verusId = normalizeVerusId(String(req.body?.verusId || ''));
    if (!isValidVerusId(verusId)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid VerusID or i-address.' });
    }

    const verification = await verifyVerusId(verusId);
    const subscribers = await loadSubscribers();
    const existing = subscribers.find((item) => item.verusId === verusId);
    const subscriber = {
      verusId,
      createdAt: existing?.createdAt || new Date().toISOString(),
      verified: verification.verified,
      identityName: verification.identity?.name || verification.identity?.identity?.name || null,
      verificationError: verification.verified ? null : verification.error,
    };

    const nextSubscribers = [
      subscriber,
      ...subscribers.filter((item) => item.verusId !== verusId),
    ];

    await writeJson(subscribersFile, nextSubscribers);

    const inbox = await loadInbox();
    const notification = {
      id: crypto.randomUUID(),
      recipientVerusId: verusId,
      subject: 'Verus launch alerts enabled',
      body: 'You subscribed to launch updates delivered through VerusID instead of email.',
      channel: 'verus-native',
      createdAt: new Date().toISOString(),
      verified: verification.verified,
      status: 'queued',
    };

    await writeJson(inboxFile, [notification, ...inbox]);

    res.json({
      ok: true,
      subscriber,
      notification,
      rpcVerified: verification.verified,
      rpcError: verification.verified ? null : verification.error,
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/verus/broadcast', async (req, res, next) => {
  try {
    const subject = String(req.body?.subject || 'Coming Soon launch update').trim() || 'Coming Soon launch update';
    const message = String(req.body?.message || 'You are on the Verus subscriber list. Launch updates will arrive through VerusID instead of email.').trim();

    const subscribers = await loadSubscribers();
    const signer = await getWalletSigningIdentity();

    const results = [];
    const indexes = await loadInboxIndex();

    for (const subscriber of subscribers) {
      const recipientVerusId = subscriber.verusId;
      const recipientIAddress = await resolveIAddress(recipientVerusId);
      console.log('[broadcast] recipient', recipientVerusId, 'iaddr', recipientIAddress);
      let zaddress = '';
      try {
        const derived = await zGetEncryptionAddress(signer.identityaddress, recipientIAddress);
        zaddress = derived.zaddress;
        console.log('[broadcast] derived zaddr', zaddress || '(empty)');
      } catch (error) {
        console.log('[broadcast] z_getencryptionaddress failed for', recipientVerusId, error instanceof Error ? error.message : error);
      }
      console.log('[broadcast] sending to', zaddress || `${recipientVerusId}:private`);
      const encrypted = await sendEncryptedBroadcast(signer.identityaddress, zaddress || `${recipientVerusId}:private`, subject, message, {
        recipientVerusId,
        channel: 'verus-native',
      });
      console.log('[broadcast] txid', encrypted.txid);

      const indexEntry = {
        id: crypto.randomUUID(),
        txid: encrypted.txid,
        recipientVerusId,
        subject,
        channel: 'verus-native',
        createdAt: new Date().toISOString(),
      };

      results.push(indexEntry);
      indexes.unshift(indexEntry);
    }

    await writeJson(inboxIndexFile, indexes);

    res.json({ ok: true, delivered: results.length, results });
  } catch (error) {
    next(error);
  }
});

app.post('/api/verus/inbox/decrypt-request', async (req, res, next) => {
  try {
    const verusId = normalizeVerusId(String(req.body?.verusId || ''));
    if (!isValidVerusId(verusId)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid VerusID or i-address.' });
    }

    const verification = await verifyVerusId(verusId);
    if (!verification.verified) {
      return res.status(400).json({ ok: false, error: verification.error || 'Unable to verify VerusID.' });
    }

    const signer = await getWalletSigningIdentity();
    const signerIAddress = signer.identityaddress;
    const iAddress = await resolveIAddress(verusId);
    const requestIDKey = iAddress;
    const requestID = CompactIAddressObject.fromAddress(requestIDKey);
    console.log('[decrypt-request] verusId', verusId, 'iAddress', iAddress, 'signer', signerIAddress, 'requestID', requestIDKey);

    const BN = (await import('bn.js')).default;
    const requestDetails = new AppEncryptionRequestDetails({
      requestID,
      derivationNumber: new BN(0),
      derivationID: CompactIAddressObject.fromAddress(iAddress),
    });

    const requestOrdinal = new AppEncryptionRequestOrdinalVDXFObject({ data: requestDetails });
    const request = new GenericRequest({
      requestID,
      createdAt: new BN(Math.floor(Date.now() / 1000)),
      salt: crypto.randomBytes(16),
      appOrDelegatedID: CompactIAddressObject.fromAddress(signerIAddress),
      details: [requestOrdinal],
    });

    const callbackUri = RequestURI.fromUriString(`${CALLBACK_BASE_URL}/api/verus/inbox/decrypt-callback`);
    request.responseURIs = [callbackUri];
    console.log('[decrypt-request] request built');

    pendingDecryptRequests.set(requestIDKey, {
      requestID: requestIDKey,
      verusId,
      iAddress,
      signerIAddress,
      createdAt: Date.now(),
    });

    const requestUri = request.toWalletDeeplinkUri();
    res.json({
      ok: true,
      verusId,
      requestID: requestIDKey,
      requestUri,
      qrDataUrl: await QRCode.toDataURL(requestUri, { errorCorrectionLevel: 'M', margin: 1, scale: 6 }),
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/verus/inbox/challenge', async (req, res, next) => {
  try {
    const verusId = normalizeVerusId(String(req.query?.verusId || ''));

    if (!isValidVerusId(verusId)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid VerusID or i-address.' });
    }

    const verification = await verifyVerusId(verusId);
    if (!verification.verified) {
      return res.status(400).json({ ok: false, error: verification.error || 'Unable to verify VerusID.' });
    }

    const challenge = [
      'Coming Soon inbox unlock',
      `verusId=${verusId}`,
      `nonce=${crypto.randomUUID()}`,
      `issuedAt=${new Date().toISOString()}`,
    ].join('\n');

    const iAddress = await resolveIAddress(verusId);

    const signer = await getWalletSigningIdentity();
    const signerIAddress = signer.identityaddress;

    const sharedChallenge = {
      challenge_id: iAddress,
      created_at: Math.floor(Date.now() / 1000),
      requested_access: [{ vdxfkey: IDENTITY_VIEW.vdxfid }],
      redirect_uris: [{
        uri: `${CALLBACK_BASE_URL}/api/verus/inbox/callback`,
        vdxfkey: LOGIN_CONSENT_WEBHOOK_VDXF_KEY.vdxfid,
      }],
    };

    const walletRequest = new LoginConsentRequest({
      system_id: TESTNET_REQUEST_CURRENCY_ID,
      signing_id: signerIAddress,
      challenge: sharedChallenge,
      signature: { signature: '' },
    });

    console.log('[debug] signerIAddress:', signerIAddress);
    console.log('[debug] user iAddress:', iAddress);

    walletRequest.challenge.context = new Context({});

    console.log('[debug] request.version:', walletRequest.version.toString());
    console.log('[debug] challenge.version:', walletRequest.challenge.version.toString());
    console.log('[debug] context.version:', walletRequest.challenge.context.version?.toString());
    console.log('[debug] signature.version:', walletRequest.signature.version.toString());

    const blockInfo = await rpcCall('getblockchaininfo', []);
    const blockHeight = Number(blockInfo.blocks);
    console.log('[debug] blockHeight:', blockHeight);

    const challengeHash = walletRequest.getChallengeHash(blockHeight);
    console.log('[debug] challengeHash hex:', challengeHash.toString('hex'));

    let privKeyBytes;
    console.log('[debug] trying dumpprivkey with identity address...');
    try {
      const wif = await rpcCall('dumpprivkey', [signerIAddress]);
      const payload = bs58check.decode(wif);
      privKeyBytes = payload.slice(1, 33);
      console.log('[debug] dumpprivkey with identity address succeeded');
    } catch (e) {
      console.log('[debug] dumpprivkey with identity address failed:', e.message);
      console.log('[debug] falling back to primary address...');
      const signerIdentity = await rpcCall('getidentity', [signerIAddress]);
      const primaryAddress = signerIdentity?.identity?.primaryaddresses?.[0];
      if (!primaryAddress) throw new Error('No primary address available for signing identity');
      console.log('[debug] primaryAddress:', primaryAddress);
      const wif = await rpcCall('dumpprivkey', [primaryAddress]);
      const payload = bs58check.decode(wif);
      privKeyBytes = payload.slice(1, 33);
      console.log('[debug] dumpprivkey with primary address succeeded');
    }

    const privD = BigInteger.fromBuffer(privKeyBytes);
    const keyPair = new ECPairLib(privD, null, { network: networks.verus });

    const identitySig = new IdentitySignature(
      networks.verus, 2, 5, blockHeight, null,
      TESTNET_REQUEST_CURRENCY_ID, signerIAddress
    );

    identitySig.signHashOffline(challengeHash, keyPair);
    const sigBuf = identitySig.toBuffer();
    const signatureStr = sigBuf.toString('base64');
    console.log('[debug] IdentitySignature buffer base64 length:', sigBuf.length);
    console.log('[debug] version:', identitySig.version, 'hashType:', identitySig.hashType, 'blockHeight:', identitySig.blockHeight);
    console.log('[debug] signatures count:', identitySig.signatures.length);

    walletRequest.signature.signature = signatureStr;

    const requestUri = walletRequest.toWalletDeeplinkUri();
    console.log('[debug] requestUri:', requestUri.substring(0, 100) + '...');

    const fullBuf = walletRequest.toBuffer();
    console.log('[debug] full buffer hex:', fullBuf.toString('hex'));
    console.log('[debug] full buffer length:', fullBuf.length);

    inboxChallenges.set(verusId, {
      challenge,
      iAddress,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    res.json({
      ok: true,
      verusId,
      challenge,
      requestUri,
      qrDataUrl: await QRCode.toDataURL(requestUri, {
        errorCorrectionLevel: 'M',
        margin: 1,
        scale: 6,
      }),
    });
  } catch (error) {
    next(error);
  }
});

app.post('/api/verus/inbox/decrypt-callback', async (req, res, next) => {
  try {
    let response = null;
    if (req.body?.data) {
      response = new GenericResponse();
      response.fromBuffer(Buffer.from(req.body.data, 'base64'));
    } else if (req.body?.requestID && req.body?.details) {
      response = GenericResponse.fromJson(req.body);
    }

    if (!response) {
      return res.status(400).json({ ok: false, error: 'Invalid decrypt response payload.' });
    }

    const requestID = response.requestID?.toJson?.()?.address || response.requestID?.address || req.body?.requestID;
    if (!requestID || !pendingDecryptRequests.has(requestID)) {
      return res.status(404).json({ ok: false, error: 'No matching decrypt request found.' });
    }

    const pending = pendingDecryptRequests.get(requestID);
    const detail = response.details?.[0]?.data || response.details?.[0]?.entity || response.details?.[0];
    const ivkHex = detail?.incomingViewingKey?.toString?.('hex') || detail?.incomingviewingkey || req.body?.incomingViewingKey;
    const address = detail?.address?.toAddressString?.() || detail?.address?.address || req.body?.address;

    if (!ivkHex || !address) {
      return res.status(400).json({ ok: false, error: 'Missing encryption response details.' });
    }

    sessionIvkStore.set(pending.verusId, {
      ivkHex,
      address,
      expiresAt: Date.now() + 30 * 60 * 1000,
    });

    pendingDecryptRequests.delete(requestID);
    res.json({ ok: true, verusId: pending.verusId });
  } catch (error) {
    next(error);
  }
});

app.get('/api/verus/inbox/poll', async (req, res, next) => {
  try {
    const verusId = normalizeVerusId(String(req.query?.verusId || ''));
    if (!isValidVerusId(verusId)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid VerusID or i-address.' });
    }

    const session = sessionIvkStore.get(verusId);
    if (!session || session.expiresAt < Date.now()) {
      if (session) sessionIvkStore.delete(verusId);
      const index = await loadInboxIndex();
      const messages = index
        .filter((entry) => entry.recipientVerusId === verusId)
        .map((entry) => ({
          id: entry.txid,
          recipientVerusId: verusId,
          subject: entry.subject,
          body: 'Encrypted message waiting for approval',
          channel: entry.channel || 'verus-native',
          createdAt: entry.createdAt,
          verified: true,
          status: 'queued',
        }));
      return res.json({ ok: true, unlocked: false, messages });
    }

    const subscriber = await verifyVerusId(verusId);
    if (!subscriber.verified) {
      return res.status(400).json({ ok: false, error: subscriber.error || 'Unable to verify VerusID.' });
    }

    const signer = await getWalletSigningIdentity();
    const recipientIAddress = await resolveIAddress(verusId);
    const { zaddress } = await zGetEncryptionAddress(signer.identityaddress, recipientIAddress);
    const notes = await listReceivedNotes(zaddress || `${verusId}:private`);
    const ivkHex = session.ivkHex;

    const messages = [];
    for (const note of notes) {
      const memo = note?.memo?.[0] || note?.memo?.[0]?.memo || note?.memo?.[0]?.data;
      const datadescriptor = memo?.[Object.keys(memo || {})[0]] || memo;
      if (!note?.txid || !datadescriptor) continue;

      try {
        const decrypted = await decryptReceivedData(note.txid, datadescriptor, ivkHex);
        const text = Buffer.isBuffer(decrypted?.[0]?.objectdata) ? decrypted[0].objectdata.toString('utf8') : JSON.stringify(decrypted?.[0]?.objectdata || decrypted);
        const parsed = (() => { try { return JSON.parse(text); } catch { return null; } })();
        messages.push({
          id: note.txid,
          recipientVerusId: verusId,
          subject: parsed?.subject || 'Encrypted message',
          body: parsed?.body || text,
          channel: parsed?.channel || 'verus-native',
          createdAt: parsed?.createdAt || new Date().toISOString(),
          verified: true,
          status: 'sent',
          signerIdentity: parsed?.signerIdentity || signer.identityaddress,
          signature: parsed?.signature || '',
        });
      } catch (error) {
        console.log('[poll] decrypt failed for', note.txid, error instanceof Error ? error.message : error);
      }
    }

    const index = await loadInboxIndex();
    for (const item of index.filter((entry) => entry.recipientVerusId === verusId)) {
      if (!messages.some((msg) => msg.id === item.txid)) {
        messages.push({
          id: item.txid,
          recipientVerusId: verusId,
          subject: item.subject,
          body: 'Encrypted message pending decryption',
          channel: item.channel || 'verus-native',
          createdAt: item.createdAt,
          verified: true,
          status: 'queued',
        });
      }
    }

    messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ ok: true, unlocked: true, messages });
  } catch (error) {
    next(error);
  }
});

app.get('/api/verus/inbox/:verusId', async (_req, res) => {
  res.status(403).json({
    ok: false,
    error: 'Inbox access requires a wallet-signed challenge.',
  });
});

app.post('/api/verus/inbox/unlock', async (req, res, next) => {
  try {
    const verusId = normalizeVerusId(String(req.body?.verusId || ''));
    const challenge = String(req.body?.challenge || '');
    const signature = String(req.body?.signature || '');

    if (!isValidVerusId(verusId)) {
      return res.status(400).json({ ok: false, error: 'Enter a valid VerusID or i-address.' });
    }

    if (!challenge || !signature) {
      return res.status(400).json({ ok: false, error: 'Challenge and signature are required.' });
    }

    const cached = inboxChallenges.get(verusId);
    if (!cached || cached.challenge !== challenge || cached.expiresAt < Date.now()) {
      inboxChallenges.delete(verusId);
      return res.status(401).json({ ok: false, error: 'Challenge expired. Request a new unlock challenge.' });
    }

    const recipientIAddress = await resolveIAddress(verusId);
    const verified = await rpcCall('verifymessage', [
      recipientIAddress,
      signature,
      challenge,
    ]);

    if (!verified) {
      return res.status(401).json({ ok: false, error: 'Wallet signature could not be verified.' });
    }

    inboxChallenges.delete(verusId);
    const inbox = await loadInbox();
    const messages = inbox.filter((item) => item.recipientVerusId === verusId);

    res.json({
      ok: true,
      verusId,
      messages,
      verified: true,
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/verus/inbox/lock', async (req, res, next) => {
  try {
    const verusId = normalizeVerusId(String(req.query?.verusId || ''));
    if (verusId) {
      sessionIvkStore.delete(verusId);
    }
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.post('/api/verus/inbox/callback', async (req, res, next) => {
  try {
    const response = req.body;
    const userIAddress = response?.signing_id;
    const challengeId = response?.decision?.decision_id;

    console.log('[callback] received POST, signing_id:', userIAddress, 'decision_id:', challengeId);
    if (response?.decision?.request?.challenge?.redirect_uris) {
      console.log('[callback] redirect_uris:', JSON.stringify(response.decision.request.challenge.redirect_uris));
    }

    if (!userIAddress || !challengeId) {
      return res.status(400).json({ ok: false, error: 'Invalid LoginConsentResponse' });
    }

    let matchedVerusId = null;
    for (const [vid, data] of inboxChallenges.entries()) {
      if (data.iAddress === userIAddress) {
        matchedVerusId = vid;
        break;
      }
    }

    if (!matchedVerusId) {
      console.log('[callback] no matching challenge found for', userIAddress);
      return res.status(404).json({ ok: false, error: 'No matching challenge found for this identity' });
    }

    console.log('[callback] matched verusId:', matchedVerusId);
    inboxChallenges.delete(matchedVerusId);
    const inbox = await loadInbox();
    const messages = inbox.filter((item) => item.recipientVerusId === matchedVerusId);
    console.log('[callback] found', messages.length, 'messages for', matchedVerusId);

    res.json({ ok: true, verusId: matchedVerusId, messages });
  } catch (error) {
    next(error);
  }
});

app.post('/api/verus/wallet-request', async (req, res, next) => {
  try {
    const recipientVerusId = normalizeVerusId(String(req.body?.recipientVerusId || ''));
    const subject = String(req.body?.subject || 'Verus message').trim() || 'Verus message';
    const body = String(req.body?.body || '').trim();

    if (!recipientVerusId) {
      return res.status(400).json({ ok: false, error: 'Recipient VerusID is required.' });
    }

    const request = await buildVerusPayInvoiceRequest({
      recipientVerusId,
      subject,
      body,
    });

    res.json({
      ok: true,
      ...request,
      note: 'Open the deeplink in Verus Mobile to surface the request screen.',
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    ok: false,
    error: error instanceof Error ? error.message : 'Unexpected server error',
  });
});

if (isProduction) {
  const distDir = path.join(__dirname, 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const { readFile } = await import('fs/promises');

  app.use(express.static(distDir));
  app.get('*', async (_req, res, next) => {
    try {
      const html = await readFile(indexHtml, 'utf8');
      res.type('html').send(html);
    } catch (error) {
      next(error);
    }
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    appType: 'custom',
    server: {
      middlewareMode: true,
      host: '0.0.0.0',
      port,
    },
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }

    try {
      const indexHtml = path.join(__dirname, 'index.html');
      let template = await fs.readFile(indexHtml, 'utf8');
      template = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (error) {
      next(error);
    }
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Coming Soon server listening on http://0.0.0.0:${port}`);
});

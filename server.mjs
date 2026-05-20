import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import QRCode from 'qrcode';
import bs58check from 'bs58check';
import BN from 'bn.js';
import { LoginConsentRequest } from 'verus-typescript-primitives';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

const dataDir = path.join(__dirname, 'data');
const subscribersFile = path.join(dataDir, 'verus-subscribers.json');
const inboxFile = path.join(dataDir, 'verus-inbox.json');

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

  const payload = await response.json();

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
const inboxChallenges = new Map();

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
  const payload = bs58check.decode(value);
  return payload.length > 20 ? payload.slice(payload.length - 20) : payload;
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

const signVerusBroadcast = async (subject, message, recipientVerusIds) => {
  const signer = await getWalletSigningIdentity();
  const envelope = JSON.stringify({
    subject,
    message,
    recipients: recipientVerusIds,
    createdAt: new Date().toISOString(),
  });

  let signed;
  try {
    signed = await rpcCall('signmessage', [
      signer.identityaddress,
      envelope,
    ]);
  } catch (error) {
    throw new Error(`signmessage failed for ${signer.identityaddress}: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
  const signature = typeof signed === 'string' ? signed : signed?.signature;

  if (!signature) {
    throw new Error(`signmessage did not return a signature for ${signer.identityaddress}`);
  }

  let verification;
  try {
    verification = await rpcCall('verifymessage', [
      signer.identityaddress,
      signature,
      envelope,
    ]);
  } catch (error) {
    throw new Error(`verifymessage failed for ${signer.identityaddress}: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  return {
    signerIdentity: signer.identityaddress,
    signerName: signer.name || null,
    envelope,
    signature,
    verified: Boolean(verification),
  };
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

    const walletRequest = new LoginConsentRequest({
      system_id: TESTNET_REQUEST_CURRENCY_ID,
      signing_id: verusId,
      challenge: {
        challenge_id: verusId,
        created_at: Date.now(),
      },
      signature: {
        signature: '',
      },
    });
    const requestUri = walletRequest.toWalletDeeplinkUri();

    inboxChallenges.set(verusId, {
      challenge,
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

app.post('/api/verus/broadcast', async (req, res, next) => {
  try {
    const message = String(req.body?.message || '').trim();
    const subject = String(req.body?.subject || 'Verus update').trim() || 'Verus update';

    if (!message) {
      return res.status(400).json({ ok: false, error: 'Message body is required.' });
    }

    const subscribers = await loadSubscribers();
    const inbox = await loadInbox();
    const createdAt = new Date().toISOString();
    const broadcast = await signVerusBroadcast(
      subject,
      message,
      subscribers.map((subscriber) => subscriber.verusId)
    );

    const entries = subscribers.map((subscriber) => ({
      id: crypto.randomUUID(),
      recipientVerusId: subscriber.verusId,
      subject,
      body: message,
      channel: 'verus-native',
      createdAt,
      verified: Boolean(subscriber.verified),
      status: broadcast.verified ? 'sent' : 'queued',
      signerIdentity: broadcast.signerIdentity,
      signature: broadcast.signature,
    }));

    await writeJson(inboxFile, [...entries, ...inbox]);

    res.json({
      ok: true,
      delivered: entries.length,
      signerIdentity: broadcast.signerIdentity,
      signature: broadcast.signature,
      verified: broadcast.verified,
      entries,
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
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

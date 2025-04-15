const crypto = require('crypto');

// Check if CRYPTO_SECRET is set, if not use a default (not recommended for production)
if (!process.env.CRYPTO_SECRET) {
    console.warn('Warning: CRYPTO_SECRET not set in environment variables. Using default secret (not recommended for production)');
}

const CRYPTO_SECRET = process.env.CRYPTO_SECRET || 'BEAC4D5E549F6A861EA3F68FC8BD1'; // Use env variable or default

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(CRYPTO_SECRET, 'salt', 32);
const iv = crypto.randomBytes(16);

const encrypt = (text) => {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return { encrypted, iv: iv.toString('hex') };
};

const decrypt = (encrypted, ivHex) => {
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { encrypt, decrypt }; 
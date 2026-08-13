import "server-only";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const VERSION = "v1";

function encryptionKey() {
  const value = process.env.INTEGRATION_SECRETS_KEY;
  if (!value || value.trim().length < 24) {
    throw new Error("INTEGRATION_SECRETS_KEY chưa được cấu hình hoặc quá ngắn.");
  }
  return createHash("sha256").update(value).digest();
}

/** Mã hóa khóa API trước khi ghi vào Supabase. Chỉ code server được phép gọi. */
export function encryptIntegrationSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [VERSION, Buffer.from(iv).toString("base64url"), Buffer.from(cipher.getAuthTag()).toString("base64url"), ciphertext.toString("base64url")].join(".");
}

/** Giải mã khóa API tại server ngay trước khi gọi dịch vụ bên ngoài. */
export function decryptIntegrationSecret(storedValue: string) {
  const [version, ivValue, tagValue, ciphertextValue] = storedValue.split(".");
  if (version !== VERSION || !ivValue || !tagValue || !ciphertextValue) throw new Error("Định dạng khóa API đã mã hóa không hợp lệ.");
  try {
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertextValue, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Không thể giải mã khóa API. Hãy kiểm tra INTEGRATION_SECRETS_KEY.");
  }
}

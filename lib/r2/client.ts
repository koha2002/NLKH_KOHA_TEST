import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return { accountId, accessKeyId, secretAccessKey, bucket };
}

function client() {
  const value = config();
  if (!value) return null;
  return { value, s3: new S3Client({ region: "auto", endpoint: `https://${value.accountId}.r2.cloudflarestorage.com`, credentials: { accessKeyId: value.accessKeyId, secretAccessKey: value.secretAccessKey } }) };
}

export async function createUploadUrl(key: string, contentType: string) {
  const context = client();
  if (!context) throw new Error("R2 chưa được cấu hình.");
  const command = new PutObjectCommand({ Bucket: context.value.bucket, Key: key, ContentType: contentType });
  return getSignedUrl(context.s3, command, { expiresIn: 600 });
}

export async function createDownloadUrl(key: string, fileName?: string) {
  const context = client();
  if (!context) throw new Error("R2 chưa được cấu hình.");
  const command = new GetObjectCommand({ Bucket: context.value.bucket, Key: key, ResponseContentDisposition: fileName ? `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}` : undefined });
  return getSignedUrl(context.s3, command, { expiresIn: 300 });
}

export async function readR2Object(key: string) {
  const context = client();
  if (!context) throw new Error("R2 chưa được cấu hình.");
  const response = await context.s3.send(new GetObjectCommand({
    Bucket: context.value.bucket,
    Key: key,
  }));
  if (!response.Body) throw new Error("Tệp R2 không có nội dung.");
  return response.Body.transformToString("utf-8");
}

export async function deleteR2Object(key: string) {
  const context = client();
  if (!context) return;
  await context.s3.send(new DeleteObjectCommand({ Bucket: context.value.bucket, Key: key }));
}

export function publicR2Url(key: string) {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, "");
  return base ? `${base}/${key.split("/").map(encodeURIComponent).join("/")}` : null;
}

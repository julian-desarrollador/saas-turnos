import { AwsClient } from "aws4fetch";

import type { SiteImageStorage } from "../../application/ports/site-image-storage";

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

const UPLOAD_URL_SECONDS = "300";

export function createR2SiteImageStorage(config: R2Config): SiteImageStorage {
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: "s3",
    region: "auto",
  });
  const objectUrl = (key: string) =>
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;

  return {
    async createUploadUrl({ key, contentType, size }) {
      const url = new URL(objectUrl(key));
      url.searchParams.set("X-Amz-Expires", UPLOAD_URL_SECONDS);
      // `allHeaders` firma también content-length: R2 rechaza un archivo de otro tamaño.
      const signed = await client.sign(url.toString(), {
        method: "PUT",
        headers: { "content-type": contentType, "content-length": String(size) },
        aws: { signQuery: true, allHeaders: true },
      });
      return signed.url;
    },
    async inspect(key) {
      const response = await client.fetch(objectUrl(key), { method: "HEAD" });
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error(`R2 HEAD respondió ${response.status}`);
      }
      return {
        contentType: response.headers.get("content-type") ?? "",
        size: Number(response.headers.get("content-length") ?? "0"),
      };
    },
    async remove(key) {
      const response = await client.fetch(objectUrl(key), { method: "DELETE" });
      if (!response.ok && response.status !== 404) {
        throw new Error(`R2 DELETE respondió ${response.status}`);
      }
    },
  };
}

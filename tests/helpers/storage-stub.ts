/**
 * A reachable, S3/MinIO-shaped object storage endpoint for tests.
 *
 * PR-08 made `checkStorageReady()` open a real connection and sign a
 * `HEAD /<bucket>` request. Before that it only parsed `STORAGE_ENDPOINT` into a
 * URL, so a suite that asserted "`/readyz` is green" could pass against a URL
 * nothing was listening on. Any test asserting the green path now has to supply
 * a store that answers, which is what this stub is for: it answers HEAD with a
 * chosen status so a suite can prove both the ready and the refused case without
 * standing up MinIO.
 */

import http from "node:http";
import type { AddressInfo } from "node:net";

export interface StorageStub {
  /** Base URL to hand to `STORAGE_ENDPOINT`. */
  endpoint: string;
  /** Every request path the stub received, so a test can assert the probe landed on the bucket. */
  requests: Array<{ method: string; url: string; authorization: string | null }>;
  close: () => Promise<void>;
}

/**
 * Starts the stub on a loopback port. `status` is what `HEAD` answers with —
 * 200 proves the ready path, 403 proves a credentials refusal is not read as
 * readiness, and any non-2xx is surfaced as `unavailable`.
 */
export async function startStorageStub(options: { status?: number } = {}): Promise<StorageStub> {
  const status = options.status ?? 200;
  const requests: StorageStub["requests"] = [];
  const server = http.createServer((req, res) => {
    requests.push({
      method: req.method ?? "",
      url: req.url ?? "",
      authorization: (req.headers.authorization as string | undefined) ?? null,
    });
    // The probe signs with `x-amz-date`, which has second resolution; answering
    // immediately keeps the signature inside its validity window either way.
    res.statusCode = req.method === "HEAD" ? status : 405;
    res.end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    endpoint: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

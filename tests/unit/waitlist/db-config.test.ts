import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildPoolConfig, DatabaseConfigError } from "@/lib/server/db.mjs";

// Synthetic, non-secret test values. FAKE_PEM is not a real certificate.
const FAKE_PEM = "-----BEGIN CERTIFICATE-----\nMIIBfakefakefake\n-----END CERTIFICATE-----\n";
const REMOTE = "postgresql://web_user:not-a-secret@db.example.test:5432/coversaath";

describe("database pool options", () => {
  it("verifies TLS against a CA read from DATABASE_SSL_CA_PATH", () => {
    const config = buildPoolConfig({ DATABASE_URL: REMOTE, DATABASE_SSL_CA_PATH: "/ca.pem" }, { readFile: () => FAKE_PEM });
    expect(config.ssl).toEqual({ ca: FAKE_PEM, rejectUnauthorized: true });
  });

  it("accepts PEM text with escaped newlines from DATABASE_SSL_CA", () => {
    const config = buildPoolConfig({ DATABASE_URL: REMOTE, DATABASE_SSL_CA: FAKE_PEM.replace(/\n/g, "\\n") });
    expect(config.ssl).toEqual({ ca: FAKE_PEM, rejectUnauthorized: true });
  });

  it("strips sslmode and other ssl URL parameters so they cannot override verification", () => {
    const config = buildPoolConfig({
      DATABASE_URL: `${REMOTE}?sslmode=no-verify&sslrootcert=/x&uselibpqcompat=true&ssl=0&application_name=web`,
      DATABASE_SSL_CA: FAKE_PEM,
    });
    const url = new URL(config.connectionString!);
    expect([...url.searchParams.keys()]).toEqual(["application_name"]);
    expect(config.ssl).toMatchObject({ rejectUnauthorized: true });
  });

  it("uses verified TLS with system roots when no CA is given for a remote host", () => {
    expect(buildPoolConfig({ DATABASE_URL: REMOTE }).ssl).toEqual({ rejectUnauthorized: true });
  });

  it("still verifies TLS in production even for a local host", () => {
    const config = buildPoolConfig({ DATABASE_URL: "postgres://u@localhost:5432/db", NODE_ENV: "production" });
    expect(config.ssl).toEqual({ rejectUnauthorized: true });
  });

  it("allows plain connections only to a local development server", () => {
    expect(buildPoolConfig({ DATABASE_URL: "postgres://u@localhost:54329/db", NODE_ENV: "test" }).ssl).toBe(false);
  });

  it("rejects ambiguous or malformed CA configuration without echoing values", () => {
    expect(() => buildPoolConfig({ DATABASE_URL: REMOTE, DATABASE_SSL_CA: FAKE_PEM, DATABASE_SSL_CA_PATH: "/ca.pem" })).toThrow(DatabaseConfigError);
    expect(() => buildPoolConfig({ DATABASE_URL: REMOTE, DATABASE_SSL_CA: "not a pem" })).toThrow("not a PEM certificate");
    expect(() => buildPoolConfig({ DATABASE_URL: REMOTE, DATABASE_SSL_CA_PATH: "/missing" }, { readFile: () => { throw new Error("ENOENT"); } })).toThrow("could not be read");
    expect(() => buildPoolConfig({ DATABASE_URL: "mysql://x@db.example.test/db" })).toThrow(DatabaseConfigError);
    try {
      buildPoolConfig({ DATABASE_URL: "not a url not-a-secret" });
    } catch (error) {
      expect(String(error)).not.toContain("not-a-secret");
    }
  });

  it("never disables certificate verification anywhere in src or scripts", () => {
    const hits: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) walk(path);
        else if (/\.(m?[jt]sx?|py)$/.test(entry) && /rejectUnauthorized\s*:\s*false/.test(readFileSync(path, "utf8"))) hits.push(path);
      }
    };
    walk(join(process.cwd(), "src"));
    walk(join(process.cwd(), "scripts"));
    expect(hits).toEqual([]);
  });
});

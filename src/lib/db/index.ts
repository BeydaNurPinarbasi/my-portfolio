// PostgreSQL bağlantısı (tek havuz). Bağlantı adresi DATABASE (ya da DATABASE_URL) ortam değişkeninden gelir.
// Hot reload'da çoğalmasın diye havuz globalThis üzerinde tutulur.

import { Pool } from "pg";

export class DatabaseUnavailableError extends Error {}

const globalForDb = globalThis as unknown as { __pgPool?: Pool; __pgReady?: Promise<void> };

function connectionString(): string | undefined {
  return (process.env.DATABASE_URL ?? process.env.DATABASE)?.trim() || undefined;
}

export function getPool(): Pool {
  const url = connectionString();
  if (!url) throw new DatabaseUnavailableError("DATABASE tanımlı değil.");
  if (!globalForDb.__pgPool) {
    globalForDb.__pgPool = new Pool({
      connectionString: url,
      max: 5,
      connectionTimeoutMillis: 8_000, // ulaşılamayan veritabanı isteği sonsuza kadar bekletmesin
      idleTimeoutMillis: 30_000,
      statement_timeout: 10_000,
    });
    // Boştaki bağlantı koparsa süreç çökmesin.
    globalForDb.__pgPool.on("error", (err) => console.error("[db] havuz hatası:", err.message));
  }
  return globalForDb.__pgPool;
}

// Tablolar yoksa oluşturur (idempotent). Başarısız olursa bir sonraki istekte yeniden dener.
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__pgReady) {
    globalForDb.__pgReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS contact_messages (
           id         BIGSERIAL PRIMARY KEY,
           name       TEXT        NOT NULL,
           email      TEXT        NOT NULL,
           phone      TEXT        NOT NULL,
           topic      TEXT        NOT NULL DEFAULT '',
           message    TEXT        NOT NULL,
           is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
           created_at TIMESTAMPTZ NOT NULL DEFAULT now()
         );
         CREATE INDEX IF NOT EXISTS contact_messages_created_idx ON contact_messages (created_at DESC);`
      )
      .then(() => undefined)
      .catch((err) => {
        globalForDb.__pgReady = undefined;
        throw err;
      });
  }
  return globalForDb.__pgReady;
}

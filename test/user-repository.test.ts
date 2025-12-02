import path from 'path';
import { Client } from 'pg';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createPgTestkitClient } from '@rawsql-ts/pg-testkit';

import { UserRepository } from '../src/users.js';

const ddlPath = path.resolve(__dirname, '../ddl/schemas');

const seededRows = [
  {
    id: 1,
    email: 'alice@example.com',
    active: true,
    created_at: '2023-01-01 10:00:00'
  }
];

const tableRows = [
  {
    tableName: 'users',
    rows: seededRows
  }
];

let container: StartedPostgreSqlContainer | undefined;
let connectionUri: string | undefined;

beforeAll(async () => {
  // Launch a disposable Postgres instance so pg-testkit rewrites run against a real engine.
  container = await new PostgreSqlContainer().start();
  connectionUri = container.getConnectionUri();
});

afterAll(async () => {
  // Stop the container to clean up the test resources.
  await container?.stop();
});

function buildTestkit() {
  // Guard against building the client before the container provides a connection URI.
  if (!connectionUri) {
    throw new Error('Postgres container has not been initialized');
  }

  // Provide pg-testkit with a real Client factory so the rewrite pipeline can exercise the engine.
  return createPgTestkitClient({
    connectionFactory: async () => {
      const client = new Client({ connectionString: connectionUri });
      await client.connect();
      return client;
    },
    tableRows,
    ddl: {
      directories: [ddlPath],
      extensions: ['.sql']
    }
  });
}

describe('UserRepository with pg-testkit', () => {
  it('creates a user and returns both defaults and supplied fields', async () => {
    // Build a fresh client so every test gets an isolated fixture snapshot and connection.
    const testkit = buildTestkit();

    try {
      const repository = new UserRepository(testkit);
      const result = await repository.createUser({ email: 'bob@example.com', active: false });

      expect(result).toMatchObject({
        email: 'bob@example.com',
        active: false
      });
      expect(result.createdAt).toEqual(expect.any(String));
    } finally {
      await testkit.close();
    }
  });

  it('reads a seeded row via tableRows without touching a real database', async () => {
    // Build a fresh client so every test gets an isolated fixture snapshot and connection.
    const testkit = buildTestkit();

    try {
      const repository = new UserRepository(testkit);
      const seeded = await repository.findUserByEmail('alice@example.com');

      expect(seeded).toEqual({
        id: 1,
        email: 'alice@example.com',
        active: true,
        createdAt: expect.any(String)
      });
    } finally {
      await testkit.close();
    }
  });
});

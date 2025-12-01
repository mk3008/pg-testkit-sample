import path from 'path';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Client } from 'pg';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { createPgTestkitClient } from '@rawsql-ts/pg-testkit';

import { createUser, findUserByEmail } from '../src/users';

const ddlPath = path.resolve(__dirname, '../ddl/schemas');

const tableRows = [
  {
    tableName: 'users',
    rows: [
      {
        id: 1,
        email: 'alice@example.com',
        active: true,
        created_at: '2023-01-01 10:00:00'
      }
    ]
  }
];

let container: StartedPostgreSqlContainer | null = null;
let client: Client | null = null;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  client = new Client({ connectionString: container.getConnectionUri() });
  await client.connect();
}, 60000); // Increase timeout for container startup

afterAll(async () => {
  if (client) await client.end();
  if (container) await container.stop();
});

function buildTestClient() {
  if (!client) throw new Error('Postgres client not initialized');

  return createPgTestkitClient({
    connectionFactory: () => client!,
    tableRows,
    ddl: {
      directories: [ddlPath],
      extensions: ['.sql']
    }
  });
}

describe('UserRepository with pg-testkit', () => {
  it('creates a user and returns both defaults and supplied fields', async () => {
    const testkit = buildTestClient();

    const result = await createUser(testkit, { email: 'bob@example.com', active: false });

    expect(result).toMatchObject({
      email: 'bob@example.com',
      active: false
    });
    expect(result.createdAt).toEqual(expect.any(String));
  });

  it('reads a seeded row via tableRows without touching a real database', async () => {
    const testkit = buildTestClient();

    const seeded = await findUserByEmail(testkit, 'alice@example.com');

    expect(seeded).toEqual({
      id: 1,
      email: 'alice@example.com',
      active: true,
      createdAt: expect.any(String)
    });
  });
});


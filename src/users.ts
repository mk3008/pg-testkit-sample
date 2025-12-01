import type { Client } from 'pg';

export interface UserRecord {
  id: number;
  email: string;
  active: boolean;
  createdAt: string;
}

export interface NewUserInput {
  email: string;
  active?: boolean;
}

export async function createUser(client: Client, payload: NewUserInput): Promise<UserRecord> {
  // Run an INSERT that returns the row so callers can observe column defaults like timestamps.
  const result = await client.query(
    'insert into users (email, active) values ($1, $2) returning id, email, active, created_at',
    [payload.email, payload.active ?? true]
  );

  if (!result.rows.length) {
    throw new Error('User insert returned no rows');
  }

  // Normalize the returned row into the shared UserRecord shape.
  return mapRow(result.rows[0]);
}

export async function findUserByEmail(client: Client, email: string): Promise<UserRecord | null> {
  // Query for a specific email to validate seeded fixtures or previously inserted data.
  const result = await client.query(
    'select id, email, active, created_at from users where email = $1',
    [email]
  );

  if (!result.rows.length) {
    return null;
  }

  // Reuse the mapper so both helpers return the same normalized form.
  return mapRow(result.rows[0]);
}

function mapRow(row: Record<string, unknown>): UserRecord {
  return {
    id: Number(row.id),
    email: String(row.email),
    active: Boolean(row.active),
    createdAt: row.created_at?.toString() ?? ''
  };
}

export interface UserRecord {
  id: number;
  email: string;
  active: boolean;
  createdAt: string | null;
}

export interface NewUserInput {
  email: string;
  active?: boolean;
}

export type DatabaseClient = {
  query<T = unknown>(sql: string, values?: readonly unknown[]): Promise<{ rows: T[] }>;
};

export class UserRepository {
  constructor(private readonly client: DatabaseClient) {}

  async createUser(payload: NewUserInput): Promise<UserRecord> {
    // Ask the database to return the inserted row so we can capture defaults like timestamps.
    // Ensure created_at is emitted as text so the DTO stays string|null.
    const result = await this.client.query<UserRecord>(
      'insert into users (email, active) values ($1, $2) returning id, email, active, created_at::text as "createdAt"',
      [payload.email, payload.active ?? true]
    );

    // Fail fast if Postgres unexpectedly did not return the requested row.
    if (!result.rows.length) {
      throw new Error(`User insert returned no rows for email=${payload.email}`);
    }

    return result.rows[0];
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    // Ask the database to materialize the row so we can assert fixtures against actual columns.
    // Render created_at as text so the DTO is already shaped for TypeScript.
    const result = await this.client.query<UserRecord>(
      'select id, email, active, created_at::text as "createdAt" from users where email = $1',
      [email]
    );

    // Return null when no record is found so callers can distinguish absent fixtures.
    if (!result.rows.length) {
      return null;
    }

    return result.rows[0];
  }
}

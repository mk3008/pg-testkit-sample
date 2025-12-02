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

type UserRow = {
  id: unknown;
  email: unknown;
  active: unknown;
  created_at: unknown;
};

export class UserRepository {
  constructor(private readonly client: DatabaseClient) {}

  async createUser(payload: NewUserInput): Promise<UserRecord> {
    // Ask the database to return the inserted row so we can capture defaults like timestamps.
    const result = await this.client.query<UserRow>(
      'insert into users (email, active) values ($1, $2) returning id, email, active, created_at',
      [payload.email, payload.active ?? true]
    );

    // Fail fast if Postgres unexpectedly did not return the requested row.
    if (!result.rows.length) {
      throw new Error(`User insert returned no rows for email=${payload.email}`);
    }

    return mapRow(result.rows[0]);
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    // Ask the database to materialize the row so we can assert fixtures against actual columns.
    const result = await this.client.query<UserRow>(
      'select id, email, active, created_at from users where email = $1',
      [email]
    );

    // Return null when no record is found so callers can distinguish absent fixtures.
    if (!result.rows.length) {
      return null;
    }

    return mapRow(result.rows[0]);
  }
}

function mapRow(row: UserRow): UserRecord {
  const createdAtRaw = row.created_at;
  const activeValue = row.active;

  // Make sure we only accept explicit booleans for the active flag so mis-typed fixtures fail fast.
  if (activeValue !== true && activeValue !== false) {
    throw new Error('User row active flag is not a boolean');
  }

  // Convert the timestamp to string while treating absent values as null.
  return {
    id: Number(row.id),
    email: String(row.email),
    active: activeValue,
    createdAt: createdAtRaw == null ? null : createdAtRaw.toString()
  };
}

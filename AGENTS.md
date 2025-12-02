# AGENT INSTRUCTIONS

## ZeroTableDependency guardrails

- pg-testkit is test-only; production code (src/) must never import or depend on it. Application code must remain database-agnostic and unaware of fixtures, rewriting, or simulated results.
- Tests must supply a real pg client via connectionFactory (e.g., new Client(...) or a Testcontainers connection). Do not stub or mock Client#query; the rewrite pipeline must execute on a real Postgres engine even though no physical tables are created or modified.
- Fixtures must be provided exclusively through tableRows or the DDL loader. Never hand‑construct QueryResult objects or return arbitrary JSON from helpers. CRUD rewriting and fixture application are fully handled by pg-testkit.
- ZeroTableDependency means DDL and fixtures are the single source of truth about initial state. A reviewer must be able to understand all test preconditions solely by reading those files.
- Any test that creates tables, stubs queries, or fabricates QueryResult objects is considered a ZTD violation.

## Connection policy

- Tests may use local Postgres, Testcontainers, or any disposable engine, but must ensure no persistent writes occur.
- pg-testkit rewrites all CRUD into fixture‑backed SELECT statements. Even if the driver issues physical INSERT/UPDATE/DELETE, no persistent table is modified.

## Repository & DTO Design Philosophy

### 1. No ORM-style entity models
- TypeScript must not define entities that mirror database tables.
- The database schema (DDL) and SQL statements are the single source of truth.
- AI must not generate structures such as UserEntity, UserRow, ModelClass, or any ORM-like “entity”.

### 2. SQL shapes the DTO
- SQL must explicitly define the DTO shape using column lists, casts, and aliases.
- SELECT * is forbidden. Every column must be explicitly listed.
- Example (not a code block):  
  select id, email, active, created_at::text as "createdAt" from users;
- SQL is responsible for naming, casing, and casting. TypeScript must not perform complex mapping.

### 3. TypeScript uses a single domain DTO per concept
- Each domain concept has one DTO (e.g., UserRecord).
- Raw database rows may exist as internal types but are not domain models.

### 4. CUD and R use different DTOs
- Create/Update operations use input‑specific DTOs (e.g., NewUserInput).
- Read operations return the domain DTO (e.g., UserRecord).
- These must not be unified into an “entity” or “model class”. No ORM-style patterns.

### 5. Handling database ↔ TypeScript type gaps
- Types such as int8 or numeric that cannot be safely represented as JavaScript number must be represented as string or BigInt in DTOs.
- SQL must cast values into the correct DTO-compatible type.
- AI must not attempt to “fix” these gaps in TypeScript. SQL is the authority for shaping and casting.

### 6. Minimal normalization in TypeScript
- Normalization logic belongs primarily in SQL, not TypeScript.
- TypeScript may perform minimal logic such as converting Date → ISO string.
- Complex validation, shape correction, or mapping routines must not be implemented in TypeScript.

### 7. DatabaseClient must be a thin abstraction
- src/ must not import or use pg types such as QueryResultRow or QueryResult.
- DatabaseClient must follow this minimal interface:
  query<T = unknown>(sql: string, values?: readonly unknown[]): Promise<{ rows: T[] }>;
- Repositories must depend only on this interface, not on pg or testkit-specific behavior.

### 8. Repository implementation rules
- Repositories may write SQL directly; abstraction is not required.
- SQL statements must already produce the exact DTO shape through aliases and casts.
- Repositories may include a small normalization step, but only minimal logic is allowed.
- “as unknown as …” type assertions are forbidden. Type safety must be achieved through query<UserRecord> generics.

## TypeScript Error Policy

- AI must ensure that tsc --noEmit runs with zero errors before considering work complete.
- Errors such as TS2358, TS2339, never-related narrowing failures, and similar must always be fixed.
- If preexisting errors cannot be fixed, the AI must explicitly state the reason and mark them as out-of-scope.
- Completion is invalid if any TypeScript compile errors remain.

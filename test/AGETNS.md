# TEST AGENT INSTRUCTIONS

## Purpose
These guidelines ensure all tests maintain consistent structure, correctness, and alignment with ZeroTableDependency (ZTD) principles and repository design rules.  
All AI-generated or AI-modified test code must follow these instructions.

## 1. Test Isolation & Lifecycle

- Each test must create its own pg-testkit client instance.  
- Each test must close the client in a `finally` block using `await testkit.close()`.
- Testcontainers Postgres may be initialized **once** in beforeAll, but client instances must never be reused across tests.
- A test must not rely on state created by a previous test; ZTD requires full statelessness.

Example structure (not code block):

beforeAll → start Postgres container  
afterAll → stop container  
each test → buildTestkit(), try/finally, close()

## 2. pg-testkit Usage Rules

- Tests must use a real PostgreSQL engine via Testcontainers or an external dev instance.
- Never mock or stub pg Client#query.
- All CRUD executed by repositories must be rewritten by pg-testkit; physical tables must never be created or modified.
- Test comments must reflect ZTD accurately.  
  Avoid “without using a real database”.  
  Use “without creating or modifying physical tables”.

## 3. DatabaseClient Adapter Rules

Tests must wrap pg-testkit’s client in a thin adapter that satisfies the application’s `DatabaseClient` interface.

Adapter requirements:

- Must return `{ rows: T[] }` where T is provided by the repository.
- Must pass generic T to pg-testkit’s `query<T>`.
- Must not use `as unknown as` casting except where explicitly justified.

Required structure (not code block):

class TestkitDatabaseClient implements DatabaseClient  
- constructor(client: PgTestkitClient)  
- query<T>(sql, values?) → calls testkit.query<T>(...)  
- returns `{ rows: result.rows }`

## 4. Proper SQL Shaping in Tests

- All SQL in tests must explicitly declare columns. `SELECT *` is prohibited.
- DTO shaping must be handled in SQL, not TypeScript.
- Timestamps and other types that do not map cleanly to JS must be cast in SQL (e.g., `created_at::text as "createdAt"`).

## 5. Fixture & DDL Use

- Tests must supply `tableRows` fixtures or DDL directories, or both.
- Fixtures define table content; DDL defines table schema.
- Test code must not manually construct QueryResult objects.
- Seeded rows must use database column names (`created_at`, not `createdAt`).

## 6. Assertions & Expectations

- Tests should verify:
  - Supplied fields (e.g., email, active)
  - Defaults (e.g., timestamps)
  - Correct DTO shape (camelCase)
- Avoid over-asserting on IDs unless necessary.
- Prefer `expect.any(String)` for timestamps.

## 7. Naming & Documentation Standards

- Test names must describe behavior from a user or repository perspective.
- Comments must clarify *why* the test exists, not restate code behavior.
- Avoid referencing internal pg-testkit behavior except where relevant for ZTD.

## 8. Prohibited Patterns

The following must never appear in tests:

- Manual table creation (CREATE TABLE…)
- Manual cleanup (DROP TABLE…)
- Stubbing pg client methods
- Returning hand-written `{ rows: [...] }` without pg-testkit
- Relying on implicit state between tests
- SELECT * queries
- Mutating repository instances across tests

## 9. Test Quality Requirements

Before considering a test complete:

- No TypeScript errors may remain.
- All SQL statements must be valid and explicitly shaped.
- All DTOs returned must match the domain DTOs defined in src/.
- Test names must be descriptive and aligned with this guide.
- Tests must be deterministic and reproducible regardless of order.

## 10. Template Encouraged

All new repository tests should follow this structure:

1. Seed fixtures (tableRows or DDL inserts)
2. buildTestkit()
3. Wrap in TestkitDatabaseClient
4. Instantiate repository
5. Call repository method
6. Assert DTO shape + semantics
7. Close testkit in finally

This template ensures long-term consistency and clarity across the entire test suite.

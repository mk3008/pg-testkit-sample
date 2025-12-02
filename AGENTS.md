# AGENT INSTRUCTIONS

## ZeroTableDependency guardrails

- pg-testkit is test-only; production code (src/) must never import or depend on it. Application code should remain database-agnostic and unaware of the fixture system.
- Tests must supply a real pg client via connectionFactory (e.g., new Client(...) or a Testcontainers connection). Do not stub or mock Client#query; the rewrite pipeline must execute on a real Postgres engine even though no physical tables are created or modified.
- Feed fixtures exclusively through tableRows or the DDL loader. Never hand-construct QueryResult objects or emit arbitrary JSON from helpers. CRUD rewriting and fixture application are entirely handled by pg-testkit.
- ZeroTableDependency means DDL and fixtures are the single source of truth about initial state. Reviewers should be able to understand all preconditions by reading those files alone, without real tables, mocks, or custom SQL handlers.
- Any test that creates tables, stubs queries, or fabricates QueryResult objects is a ZTD violation and must be rewritten to follow the model.

## Connection policy
- Tests may connect to a local Postgres instance, Testcontainers, or another disposable engine, but the setup must guarantee that no writes reach persistent tables. pg-testkit and its fixtures fully shadow all CRUD activity, ensuring a deterministic, stateless test environment.

# pg-testkitデモ

本リポジトリは[@rawsql-ts/pg-testkit](https://www.npmjs.com/package/@rawsql-ts/pg-testkit)を使った Vitest 製のサンプルです。
`createPgTestkitClient` / `fixtures` / `ddl` / `tableRows` の使い方が `test/user-repository.test.ts` で確認できます。

# Usage

1. `npm install`
2. `npm run test`

`createUser` と `findUserByEmail` は `src/users.ts` にあり、Postgres SQL を発行して結果を `PgTestkitClient` 経由で受け取ります。

`test/user-repository.test.ts` では以下を示します:

- `createPgTestkitClient` に `fixtures` + `tableRows` + `ddl` を渡す方法
- `UserRepository` で通常の pg クエリを呼び出し、結果が rebuilding された JSON で返ること
- `createStubConnection` で `pg.Client` をスタブ化し、ローカル DB を用意せずに `vitest` で検証できること

`ddl/schemas/users.sql` には必要なテーブル/シーケンス定義を入れてあります。README を読んでそのまま `npm run test` を叩けば、`@rawsql-ts/pg-testkit` の基本的な体験ができます。

## 注意点

- 本デモでは Docker を使用しているため、Docker Desktop などのサービスを事前に起動しておく必要があります。
- デモでは Docker を使用していますが、`pg-testkit` 自体は Docker が必須というわけではありません（既存の Postgres インスタンスも利用可能です）。

import { PgClient } from "@effect/sql-pg";
import { Context, Effect, Layer, Redacted } from "effect";
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { relations } from "./schema.ts";
import * as dotenv from "dotenv";

const dbEffect = PgDrizzle.make({ relations }).pipe(Effect.provide(PgDrizzle.DefaultServices));

export class DatabaseService extends Context.Tag("DatabaseService")<
  DatabaseService,
  Effect.Effect.Success<typeof dbEffect>
>() {}

export const DatabaseLive = Layer.effect(DatabaseService, dbEffect);

dotenv.config({ quiet: true });
export const PgClientLive = PgClient.layer({
  url: Redacted.make(process.env.DATABASE_URL!),
});

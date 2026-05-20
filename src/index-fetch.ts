import { Effect } from "effect";
import { BrowserLive } from "./browser.ts";
import { NodeRuntime } from "@effect/platform-node";
import { DatabaseLive, PgClientLive } from "./db.ts";
import { fetchNovel } from "./fetch.ts";

const program = Effect.gen(function* () {
  yield* fetchNovel(8);
});

NodeRuntime.runMain(
  program
    .pipe(Effect.provide(BrowserLive))
    .pipe(Effect.provide(DatabaseLive))
    .pipe(Effect.provide(PgClientLive)),
);

import { Effect } from "effect";
import { BrowserLive } from "./browser.ts";
import { NodeContext, NodeRuntime } from "@effect/platform-node";
import { FileSystem } from "@effect/platform";
import { DatabaseLive, DatabaseService, PgClientLive } from "./db.ts";

const program = Effect.gen(function* () {
  const db = yield* DatabaseService;

  const novel = yield* db.query.novelTable.findFirst({
    with: {
      volumes: {
        with: {
          chapters: true,
        },
      },
    },
  });

  const fs = yield* FileSystem.FileSystem;
  yield* fs.writeFileString("novel.json", JSON.stringify(novel));
});

NodeRuntime.runMain(
  program
    .pipe(Effect.provide(BrowserLive))
    .pipe(Effect.provide(NodeContext.layer))
    .pipe(Effect.provide(DatabaseLive))
    .pipe(Effect.provide(PgClientLive)),
);

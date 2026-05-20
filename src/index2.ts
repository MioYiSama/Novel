import { Effect } from "effect";
import { NodeFileSystem, NodeRuntime } from "@effect/platform-node";
import { DatabaseLive, DatabaseService, PgClientLive } from "./db.ts";
import { FileSystem } from "effect/FileSystem";

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

  const fs = yield* FileSystem;
  yield* fs.writeFileString("novel.json", JSON.stringify(novel, null, 2));
});

NodeRuntime.runMain(
  program
    .pipe(Effect.provide(DatabaseLive))
    .pipe(Effect.provide(PgClientLive))
    .pipe(Effect.provide(NodeFileSystem.layer)),
);

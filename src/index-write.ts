import { Effect } from "effect";
import { NodeFileSystem, NodeHttpClient, NodePath, NodeRuntime } from "@effect/platform-node";
import { DatabaseLive, DatabaseService, PgClientLive } from "./db.ts";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { downloadImage, getImageUuid } from "./util.ts";
import { BrowserLive } from "./browser.ts";

const programMarkdown = Effect.gen(function* () {
  const db = yield* DatabaseService;
  const fs = yield* FileSystem;

  const novel = (yield* db.query.novelTable.findFirst({
    where: { id: 8 },
    with: {
      volumes: {
        with: {
          chapters: {
            orderBy: { no: "asc" },
          },
        },
        orderBy: { no: "asc" },
      },
    },
  }))!;

  const path = yield* Path;
  const novelPath = path.join("novels", novel.name);
  if (!(yield* fs.exists(novelPath))) {
    yield* fs.makeDirectory(novelPath, { recursive: true });
  }

  for (const volume of novel.volumes) {
    const lines: string[] = [`# ${volume.name}`];

    const volumePath = path.join(novelPath, volume.name);
    if (!(yield* fs.exists(volumePath))) {
      yield* fs.makeDirectory(volumePath, { recursive: true });
    }
    const imagesPath = path.join(volumePath, "images");
    if (!(yield* fs.exists(imagesPath))) {
      yield* fs.makeDirectory(imagesPath, { recursive: true });
    }

    for (const chapter of volume.chapters) {
      lines.push(`## ${chapter.name}`);

      for (const item of chapter.content) {
        switch (item.type) {
          case "paragraph":
            lines.push(item.text);
            break;
          case "center":
            lines.push(`<center>${item.text}</center>`);
            break;
          case "newline":
            lines.push("");
            break;
          case "image":
            const uuid = getImageUuid(item.url);
            const imagePath = path.join(imagesPath, uuid + ".jpg");
            yield* downloadImage(item.url, imagePath);

            lines.push(`![${uuid}](./images/${uuid}.jpg)`);
            break;
        }
      }
    }

    yield* fs.writeFileString(path.join(volumePath, "index.md"), lines.join("\n\n"));
  }
});

NodeRuntime.runMain(
  Effect.scoped(programMarkdown)
    .pipe(Effect.provide(BrowserLive))
    .pipe(Effect.provide(DatabaseLive))
    .pipe(Effect.provide(PgClientLive))
    .pipe(Effect.provide(NodeHttpClient.layerFetch))
    .pipe(Effect.provide(NodeFileSystem.layer))
    .pipe(Effect.provide(NodePath.layer)),
);

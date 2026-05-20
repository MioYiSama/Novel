import { Effect } from "effect";
import { NodeFileSystem, NodeHttpClient, NodePath, NodeRuntime } from "@effect/platform-node";
import { DatabaseLive, DatabaseService, PgClientLive } from "./db.ts";
import { FileSystem } from "effect/FileSystem";
import { Path } from "effect/Path";
import { downloadImage, getImageUuid } from "./util.ts";
import { BrowserLive } from "./browser.ts";
import { execSync } from "node:child_process";

const programTypst = Effect.gen(function* () {
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
    const lines: string[] = [];

    const volumePath = path.join(novelPath, volume.name);
    if (!(yield* fs.exists(volumePath))) {
      yield* fs.makeDirectory(volumePath, { recursive: true });
    }
    const imagesPath = path.join(volumePath, "images");
    if (!(yield* fs.exists(imagesPath))) {
      yield* fs.makeDirectory(imagesPath, { recursive: true });
    }

    for (const chapter of volume.chapters) {
      lines.push(`== ${chapter.name}`);

      for (const item of chapter.content) {
        switch (item.type) {
          case "paragraph":
            lines.push(`#text("${item.text.replaceAll('"', '\\"')}")`);
            break;
          case "center":
            lines.push(`#align(center, text("${item.text.replaceAll('"', '\\"')}"))`);
            break;
          case "newline":
            lines.push("#linebreak()");
            break;
          case "image":
            const uuid = getImageUuid(item.url);
            const imagePath = path.join(imagesPath, uuid + ".jpg");
            yield* downloadImage(item.url, imagePath);

            lines.push(`#image(read("./images/${uuid}.jpg", encoding: none), format: auto)`);
            break;
        }
      }

      lines.push("#pagebreak(weak: true)");
    }

    const uuid = getImageUuid(volume.cover);
    const imagePath = path.join(imagesPath, uuid + ".jpg");
    yield* downloadImage(volume.cover, imagePath);

    const HEADER = `#set page(margin: 0cm)

#image(read("./images/${uuid}.jpg", encoding: none), format: auto, width: 100%, height: 100%)

#set page(margin: 1.5cm, numbering: "1 / 1")
#set text(font: "Noto Serif CJK SC", size: 10pt)
#set par(first-line-indent: (amount: 2em, all: true), spacing: 0.75em)
#show heading: set text(font: "Noto Sans CJK SC", size: 2em)
#show heading.where(level: 2): set text(size: 16pt)
#show heading: set align(center)
#show image: rect

= ${volume.name}

#[
  #set text(size: 1.5em)
  #outline(target: heading.where(level: 2), title: [])
]

#set page(columns: 2)
`;

    const typPath = path.join(volumePath, "index.typ");
    yield* fs.writeFileString(typPath, HEADER + lines.join("\n\n"));
    execSync(`typst compile "${typPath}"`);
  }
});

NodeRuntime.runMain(
  Effect.scoped(programTypst)
    .pipe(Effect.provide(BrowserLive))
    .pipe(Effect.provide(DatabaseLive))
    .pipe(Effect.provide(PgClientLive))
    .pipe(Effect.provide(NodeHttpClient.layerFetch))
    .pipe(Effect.provide(NodeFileSystem.layer))
    .pipe(Effect.provide(NodePath.layer)),
);

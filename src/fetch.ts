import { Data, Effect } from "effect";
import type { Chapter, ChapterContentElement, Novel, Volume } from "./types.ts";
import { BrowserService } from "./browser.ts";
import { sleepRandomlyFor } from "./util.ts";
import { DatabaseService } from "./db.ts";
import { chapterTable, novelTable, volumeTable } from "./schema.ts";

export const HOST = "https://www.bilinovel.com";

class NovelNameNotFoundError extends Data.TaggedError("NovelNameNotFoundError")<{}> {}

export const fetchNovel = (novelId: Novel["id"]) =>
  Effect.gen(function* () {
    const url = HOST + `/novel/${novelId}/catalog`;

    const browser = yield* BrowserService;

    // get Cloudflare clearance cookie
    const page = yield* browser.newPage(HOST);
    yield* Effect.promise(() => page.goto(url));
    yield* sleepRandomlyFor(2000, 5000);

    const name = yield* Effect.promise(() => page.locator("#chapterNav h1").textContent());
    if (name === null) {
      return yield* Effect.fail(new NovelNameNotFoundError());
    }

    const db = yield* DatabaseService;
    yield* db
      .insert(novelTable)
      .values({
        id: novelId,
        name,
      })
      .onConflictDoNothing();

    const volumeIds = yield* Effect.promise(async () => {
      // 获取所有a元素
      const elements = await page.locator("li.chapter-bar > a").all();

      // 获取所有a元素的URL
      const volumeUrls = await Promise.all(elements.map((a) => a.getAttribute("href")));

      // 使用正则表达式提取volumeId
      const regex = new RegExp(`/novel/${novelId}/vol_(\\d+).html`);
      return volumeUrls.map((url) => {
        return parseInt(regex.exec(url!)![1]!, 10);
      });
    });

    const volumes = yield* Effect.all(
      volumeIds.map((volumeId, no) => fetchVolume({ volumeId, novelId, no })),
      { concurrency: 1 },
    );

    return {
      id: novelId,
      name,
      volumes,
    } satisfies Novel;
  }).pipe(Effect.scoped);

class VolumeNameNotFoundError extends Data.TaggedError("VolumeNameNotFoundError")<{}> {}
class VolumeCoverNotFoundError extends Data.TaggedError("VolumeCoverNotFoundError")<{}> {}

export const fetchVolume = ({
  volumeId,
  novelId,
  no,
}: {
  volumeId: Volume["id"];
  novelId: Novel["id"];
  no: number;
}) =>
  Effect.scoped(
    Effect.gen(function* () {
      const url = HOST + `/novel/${novelId}/vol_${volumeId}.html`;
      const browser = yield* BrowserService;
      const page = yield* browser.newPage(url);

      const name = yield* Effect.promise(() => page.locator("h1.book-title").textContent());
      if (name === null) {
        return yield* Effect.fail(new VolumeNameNotFoundError());
      }

      const cover = yield* Effect.promise(() =>
        page.locator("div.module-item-cover > img").getAttribute("src"),
      );
      if (cover === null) {
        return yield* Effect.fail(new VolumeCoverNotFoundError());
      }

      const db = yield* DatabaseService;
      yield* db
        .insert(volumeTable)
        .values({
          id: volumeId,
          novelId,
          no,
          name,
          cover,
        })
        .onConflictDoNothing();

      const chapterIds = yield* Effect.promise(async () => {
        const elements = await page.locator("div.catalog-volume > ul > li > a").all();
        const chapterUrls = await Promise.all(elements.map((a) => a.getAttribute("href")));
        const regex = new RegExp(`/novel/${novelId}/(\\d+).html`);
        return chapterUrls.map((url) => {
          return parseInt(regex.exec(url!)![1]!, 10);
        });
      });

      const chapters = yield* Effect.all(
        chapterIds.map((chapterId, no) => fetchChapter({ chapterId, volumeId, novelId, no })),
        { concurrency: 1 },
      );

      return {
        id: volumeId,
        novelId,
        no,
        name,
        cover: new URL(cover),
        chapters,
      } satisfies Volume;
    }),
  );

class ChapterNameNotFoundError extends Data.TaggedError("ChapterNameNotFoundError")<{}> {}

export const fetchChapter = ({
  chapterId,
  volumeId,
  novelId,
  no,
}: {
  chapterId: Chapter["id"];
  volumeId: Volume["id"];
  novelId: Novel["id"];
  no: number;
}) =>
  Effect.scoped(
    Effect.gen(function* () {
      // 直接返回已抓取完成的Chapter
      const db = yield* DatabaseService;
      let chapter = yield* db.query.chapterTable.findFirst({
        where: {
          id: chapterId,
          volumeId,
          novelId,
        },
      });
      if (chapter) {
        return chapter;
      }

      const browser = yield* BrowserService;
      const page = yield* browser.newPage(HOST + `/novel/${novelId}/${chapterId}.html`);

      const name = yield* Effect.promise(() => page.locator("h1#atitle").textContent());
      if (name === null) {
        return yield* Effect.fail(new ChapterNameNotFoundError());
      }

      // 收集Content+翻页
      let content: Array<ChapterContentElement> = [];
      while (true) {
        const elements = yield* Effect.promise(() => page.locator("div#acontent > *").all());
        for (const element of elements) {
          const tagName = yield* Effect.promise(() =>
            element.evaluate((e) => e.tagName.toLowerCase()),
          );

          switch (tagName) {
            case "p":
              content.push({
                type: "paragraph",
                text: (yield* Effect.promise(() => element.textContent()))!,
              });
              break;
            case "center":
              content.push({
                type: "center",
                text: (yield* Effect.promise(() => element.textContent()))!,
              });
              break;
            case "img":
              yield* Effect.promise(() => element.scrollIntoViewIfNeeded());
              yield* Effect.sleep(300);
              content.push({
                type: "image",
                url: (yield* Effect.promise(() => element.getAttribute("src")))!,
              });
              break;
            case "br":
              content.push({ type: "newline" });
              break;
            default:
              // console.log({ tagName, html: yield* Effect.promise(() => element.innerHTML()) });
              break;
          }
        }

        const { url_next } = (yield* Effect.promise(() => page.evaluate("ReadParams"))) as {
          url_next: string; //"/novel/8/1847_2.html"
        };
        if (!url_next.startsWith(`/novel/${novelId}/${chapterId}_`)) {
          break;
        }

        yield* sleepRandomlyFor(2000, 5000);
        yield* Effect.promise(() => page.goto(HOST + url_next));
      }

      // 存储Chapter
      chapter = {
        id: chapterId,
        volumeId,
        novelId,
        no,
        name,
        content,
      };
      yield* db.insert(chapterTable).values(chapter);
      return chapter;
    }),
  );

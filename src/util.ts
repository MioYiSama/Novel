import { Duration, Effect, Random } from "effect";
import { HttpClient } from "effect/unstable/http/HttpClient";
import * as playwright from "playwright-core";
import { v5 as uuidv5 } from "uuid";
import { HOST } from "./fetch.ts";
import { FileSystem } from "effect/FileSystem";

export const sleepRandomlyFor = (min: number, max: number) =>
  Random.nextIntBetween(min, max).pipe(Effect.flatMap((ms) => Effect.sleep(Duration.millis(ms))));

export const sleepRandomly = () => sleepRandomlyFor(1500, 4000);

export async function filterRequests(page: playwright.Page, resTypes: string[]) {
  return await page.route("**/*", async (route) => {
    const resType = route.request().resourceType();

    if (!resTypes.includes(resType)) {
      await route.abort("blockedbyclient");
      return;
    }

    await route.fallback();
  });
}

const NAMESPACE = "460103db-4e5c-4736-b269-26f688ef4263";

export function getImageUuid(url: string) {
  return uuidv5(url, NAMESPACE);
}

export const downloadImage = (url: string, path: string) =>
  Effect.gen(function* () {
    const fs = yield* FileSystem;
    if (yield* fs.exists(path)) {
      return;
    }

    const client = yield* HttpClient;
    const response = yield* client.get(url, { headers: { Referer: HOST } });
    yield* fs.writeFile(path, new Uint8Array(yield* response.arrayBuffer));
    yield* Effect.sleep(1000);
  });

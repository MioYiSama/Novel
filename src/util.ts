import { Duration, Effect, Random } from "effect";
import * as playwright from "playwright-core";

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

import * as playwright from "playwright-core";
import * as cloak from "cloakbrowser";
import { Context, Effect, Layer, Scope } from "effect";
import { sleepRandomlyFor } from "./util.ts";

const DEVICE = playwright.devices["Pixel 7"];

export class BrowserService extends Context.Tag("BrowserService")<
  BrowserService,
  {
    readonly context: playwright.BrowserContext;
    readonly newPage: (url: string) => Effect.Effect<playwright.Page, never, Scope.Scope>;
  }
>() {}

export const BrowserLive = Layer.scoped(
  BrowserService,
  Effect.acquireRelease(
    Effect.promise(async () => {
      const context = await cloak.launchContext({
        headless: false,
        geoip: true,
        humanize: true,
        humanPreset: "careful",
        viewport: DEVICE.viewport,
        contextOptions: DEVICE,
      });

      // Emulate mobile platform
      await context.addInitScript(() => {
        Object.defineProperty(navigator, "platform", { get: () => "Linux aarch64" });
      });

      return {
        context,
        newPage: (url) =>
          Effect.acquireRelease(
            Effect.promise(async () => {
              const page = await context.newPage();

              // Filter out unnecessary requests to speed up page loading
              await page.route("**/*", (route) => route.continue());
              await filterRequests(page, ["document", "stylesheet", "script", "xhr", "fetch"]);

              // Navigate to the specified URL
              await page.goto(url);
              return page;
            }).pipe(Effect.tap(() => sleepRandomlyFor(2000, 5000))),
            (page) => Effect.promise(() => page.close()),
          ),
      };
    }),
    ({ context }) => Effect.promise(() => context.close()),
  ),
);

async function filterRequests(page: playwright.Page, resTypes: string[]) {
  return await page.route("**/*", async (route) => {
    const resType = route.request().resourceType();

    if (!resTypes.includes(resType)) {
      await route.abort("blockedbyclient");
      return;
    }

    await route.fallback();
  });
}

import * as playwright from "playwright-core";
import * as cloak from "cloakbrowser";
import { Context, Effect, Layer, Scope } from "effect";
import { filterRequests } from "./util.ts";

const DEVICE = playwright.devices["Pixel 7"];

export class BrowserService extends Context.Service<
  BrowserService,
  {
    readonly context: playwright.BrowserContext;
    readonly newPage: (url: string) => Effect.Effect<playwright.Page, never, Scope.Scope>;
  }
>()("BrowserService") {}

export const BrowserLive = Layer.effect(
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
            }),
            (page) => Effect.promise(() => page.close()),
          ),
      };
    }),
    ({ context }) => Effect.promise(() => context.close()),
  ),
);

import { Duration, Effect, Random } from "effect";

export const sleepRandomlyFor = (min: number, max: number) =>
  Random.nextIntBetween(min, max).pipe(Effect.flatMap((ms) => Effect.sleep(Duration.millis(ms))));

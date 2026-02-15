const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export function timeout(
  ms: number,
  message = "Operation timed out",
): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), ms),
  );
}

export async function waitForCondition(
  condition: () => boolean,
  timeoutMs: number,
  throwOnTimeout = false,
) {
  const deadline = Date.now() + timeoutMs;

  while (!condition()) {
    if (Date.now() >= deadline) {
      if (throwOnTimeout) {
        throw new Error(`Wait for condition reached timeout of ${timeoutMs}`);
      }
      return;
    }
    await sleep(100);
  }
}

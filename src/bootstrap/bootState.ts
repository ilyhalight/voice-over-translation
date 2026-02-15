export type BootstrapStatus = "idle" | "booting" | "booted" | "failed";

export type BootstrapState = {
  status: BootstrapStatus;
  promise: Promise<void> | null;
  error: unknown;
};

const MAIN_BOOT_KEY = "__VOT_MAIN_BOOT_STATE__";

function isBootstrapStatus(value: unknown): value is BootstrapStatus {
  return (
    value === "idle" ||
    value === "booting" ||
    value === "booted" ||
    value === "failed"
  );
}

function isBootstrapState(value: unknown): value is BootstrapState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return isBootstrapStatus(candidate.status);
}

export function getOrCreateBootState(bootKey = MAIN_BOOT_KEY): BootstrapState {
  const scope = globalThis as Record<string, unknown>;
  const existing = scope[bootKey];

  if (isBootstrapState(existing)) {
    return existing;
  }

  const created: BootstrapState = {
    status: "idle",
    promise: null,
    error: null,
  };
  scope[bootKey] = created;
  return created;
}

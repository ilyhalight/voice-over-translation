export type BootstrapStatus = "idle" | "booting" | "booted" | "failed";

export type BootstrapState = {
  status: BootstrapStatus;
  promise: Promise<void> | null;
  error: unknown;
};

const MAIN_BOOT_KEY = "__VOT_MAIN_BOOT_STATE__";
const BOOTSTRAP_STATUSES = new Set<BootstrapStatus>([
  "idle",
  "booting",
  "booted",
  "failed",
]);

function isBootstrapStatus(value: unknown): value is BootstrapStatus {
  return BOOTSTRAP_STATUSES.has(value as BootstrapStatus);
}

function isBootstrapState(value: unknown): value is BootstrapState {
  if (!value || typeof value !== "object") return false;
  return isBootstrapStatus((value as BootstrapState).status);
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

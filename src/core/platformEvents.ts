type PlatformEventOverrides = {
  allowTouchMoveHandler?: boolean;
  disableContainerDrag?: boolean;
};

const defaultPlatformConfig: Required<PlatformEventOverrides> = {
  allowTouchMoveHandler: true,
  disableContainerDrag: false,
};

const platformOverrides: Record<string, PlatformEventOverrides> = {
  xvideos: {
    allowTouchMoveHandler: false,
  },
  youtube: {
    disableContainerDrag: true,
  },
};

export function getPlatformEventConfig(host?: string) {
  if (!host) {
    return defaultPlatformConfig;
  }

  const overrides = platformOverrides[host] ?? {};
  return {
    ...defaultPlatformConfig,
    ...overrides,
  } satisfies Required<PlatformEventOverrides>;
}

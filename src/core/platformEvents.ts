type PlatformEventOverrides = {
  allowTouchMoveHandler?: boolean;
  disableContainerDrag?: boolean;
  useDocumentInteractionTarget?: boolean;
};

const defaultPlatformConfig: Required<PlatformEventOverrides> = {
  allowTouchMoveHandler: true,
  disableContainerDrag: false,
  useDocumentInteractionTarget: false,
};

const platformOverrides: Record<string, PlatformEventOverrides> = {
  custom: {
    useDocumentInteractionTarget: true,
  },
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

type DefineValue =
  | string
  | number
  | boolean
  | null
  | readonly DefineValue[]
  | { readonly [key: string]: DefineValue };

export type ViteDefine = NonNullable<import("vite").UserConfig["define"]>;

export function defineConstants(
  constants: Record<string, DefineValue>,
): ViteDefine {
  return Object.fromEntries(
    Object.entries(constants).map(([key, value]) => [
      key,
      typeof value === "string" ? JSON.stringify(value) : value,
    ]),
  );
}

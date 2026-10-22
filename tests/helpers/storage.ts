export const memoryStorage = () => {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  };
};

export const emptyStorage = () => ({
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
});

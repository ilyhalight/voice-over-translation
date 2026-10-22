export function captureGlobal(name: string) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  return () => {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, name);
    }
  };
}

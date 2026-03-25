const webCrypto = globalThis.crypto;

if (!webCrypto?.subtle) {
  throw new TypeError("Web Crypto API is not available in this environment.");
}

export const subtle = webCrypto.subtle;
export const getRandomValues = webCrypto.getRandomValues.bind(webCrypto);
export const randomUUID =
  typeof webCrypto.randomUUID === "function"
    ? webCrypto.randomUUID.bind(webCrypto)
    : undefined;

export default webCrypto;

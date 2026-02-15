import Bowser from "bowser";

export const browserInfo = Bowser.getParser(
  globalThis.navigator.userAgent,
).getResult();

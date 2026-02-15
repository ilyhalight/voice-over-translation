import { localizationProvider } from "../localization/localizationProvider";
import type { Phrase } from "../types/localization";

class VOTLocalizedError extends Error {
  override name = "VOTLocalizedError";

  /** Original (non-localized) message key. */
  unlocalizedMessage: Phrase;

  /** Resolved localized message. */
  localizedMessage: string;

  constructor(message: Phrase) {
    super(localizationProvider.getDefault(message));
    this.unlocalizedMessage = message;
    this.localizedMessage = localizationProvider.get(message);
  }
}

export default VOTLocalizedError;

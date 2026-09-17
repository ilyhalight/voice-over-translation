import { createStore } from "solid-js/store";

export type LocaleStore = {
  updatedAt: number;
  hash: string;
};

function createInitialState(): LocaleStore {
  return {
    updatedAt: 0,
    hash: "",
  };
}

export const [locale, setLocale] = createStore<LocaleStore>(
  createInitialState(),
);

export function resetLocale() {
  setLocale(createInitialState());
}

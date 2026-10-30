import { createStore } from "solid-js/store";

type LocaleStore = {
  updatedAt: number;
  hash: string;
};

export const [locale, setLocale] = createStore<LocaleStore>({
  updatedAt: 0,
  hash: "",
});

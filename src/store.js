import { writable } from "svelte/store";

export const store = writable({
  gameServer: null,
});

import { writable } from 'svelte/store';
import { GameServer } from './connection/GameServer';

export const store = writable({
  gameServer: new GameServer(),
});

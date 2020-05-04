import { writable } from 'svelte/store';

const writableLocalStorage = (key, startValue) => {
  const { subscribe, set } = writable(startValue);
  
	return {
    subscribe,
    set,
    useLocalStorage: () => {
      const json = localStorage.getItem(key);
      if (json) {
        set(JSON.parse(json));
      }
      
      subscribe(current => {
        localStorage.setItem(key, JSON.stringify(current));
      });
    }
  };
}

export const data = writableLocalStorage('data', [
    {
        title: "Hello"
    }
]);
import { writable, get } from 'svelte/store';

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
    },
    sort(key, sorted){
      let obj = get(this)
      obj.sort(function(a, b) {
        let nameA = a[key]
        let nameB = b[key]
        if(typeof a[key] !== "boolean"){  //check if boolean. if not, skip the uppercase
          nameA = nameA.toUpperCase(); // ignore upper and lowercase
          nameB = nameB.toUpperCase(); // ignore upper and lowercase
        }
        if (nameA < nameB) {
          if(sorted){
            return -1;
          } else {
            return 1
          }
        }
        if (nameA > nameB) {
          if(!sorted){
            return -1;
          } else {
            return 1
          }
        }
      })
      this.set(obj)
    }
  };
}

export const data = writableLocalStorage('data', [
    {
      title: "Hello",
      author: "Harry Windsor",
      genre: "Fantasy",
      location: "Algund",
      read: false
    },
    {
      title: "Fresh",
      author: "Freshi Alman",
      genre: "Comic",
      location: "Algund",
      read: true
    },
    {
      title: "Test",
      author: "Test",
      genre: "tset",
      location: "Brixen",
      read: true
    }
]);
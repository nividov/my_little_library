import { data } from "../store.js"
import { get } from 'svelte/store';

export function addNewEntry(newEntry) {
    data.useLocalStorage()
    let dataStore = get(data)
    let newObject = processInput(newEntry)
    if(!checkForDuplicates(newObject, dataStore)){
        addInputToData(newObject, dataStore)
    }
}

function processInput(input){
    let form = input.currentTarget
    let title = form.elements.namedItem("title").value
    let author = form.elements.namedItem("author").value    
    return {
        title: title,
        author: author
    }
}

function checkForDuplicates(input, dataStore){
    //both these methods do not work, i don't know why...

    // console.log(get(data).indexOf(input))    //ergebnis ist immer -1?? wieso??

    // for(let i = 0; i < dataStore.length; i++){
    //     console.log(dataStore[i], input)
    //     if(dataStore[i] === input){
    //         alert("Dieser Eintrag existiert bereits")
    //         return true
    //     }
    // }
}

function addInputToData(newEntry, dataStore){
    data.set([...dataStore, newEntry])
}
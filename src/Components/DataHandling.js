import { entries } from "../store.js"
import { get } from 'svelte/store';

export function addNewEntry(userInput) {
    let dataStore = get(entries)
    let newObject = processInput(userInput)
    if(!checkForDuplicates(newObject, dataStore)){
        addInputToData(newObject, dataStore)
    }
}

export function changeEntry(userInput, index){
    let dataStore = get(entries)
    let newObject = processInput(userInput)
    if(!checkForDuplicates(newObject, dataStore)){
        changeData(newObject, dataStore, index)
    }
}

function processInput(input){
    let form = input.currentTarget
    let title = form.elements.namedItem("title").value
    let author = form.elements.namedItem("author").value
    let genre = form.elements.namedItem("genre").value    
    let location = form.elements.namedItem("location").value
    let read = form.elements.namedItem("read").checked


    return {
        title: title,
        author: author,
        genre: genre,
        location: location,
        read: read
    }
}

function checkForDuplicates(input, dataStore){
    //both these methods do not work, i don't know why...

    // console.log(get(entries).indexOf(input))    //ergebnis ist immer -1?? wieso??

    // for(let i = 0; i < dataStore.length; i++){
    //     console.log(dataStore[i], input)
    //     if(dataStore[i] === input){
    //         alert("Dieser Eintrag existiert bereits")
    //         return true
    //     }
    // }
}

function addInputToData(newEntry, dataStore){
    entries.set([...dataStore, newEntry])
}

function changeData(newEntry, dataStore, index){
    dataStore[index] = newEntry
    entries.set(dataStore)
}

export function deleteEntry(index){
    let dataStore = get(entries)
    dataStore.splice(index, 1)
    entries.set(dataStore)
}
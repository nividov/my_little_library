
export function addNewEntry(newEntry) {
    let newObject = processInput(newEntry)
    checkForDuplicates(newObject)
    if(!checkForDuplicates(newObject)){
        addInputToData(newObject)
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

function checkForDuplicates(input){
    let data = JSON.parse(localStorage.getItem("data"));
    for(let i = 0; i < data.length; i++){
        if(data[i] === input){
            alert("Dieser Eintrag existiert bereits")
            return true
        }
    }
}

function addInputToData(newEntry){
    let data = JSON.parse(localStorage.getItem("data"));
    data = [...data, newEntry]
    localStorage.setItem("data", JSON.stringify(data))
}
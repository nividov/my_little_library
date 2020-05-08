<script>
    import { addEntry } from "./DataHandling.js"
    import { data } from "../store.js"
    import HomeButton from "./HomeButton.svelte"

    data.useLocalStorage();

    let inputField

    function newEntry(newThing){
        let form = newThing.currentTarget
        let title = form.elements.namedItem("title").value
        let author = form.elements.namedItem("author").value

        for(let i = 0; i < $data.length; i++){
            if($data[i].title === title && $data[i].author === author ){
                alert("Dieser Eintrag existiert bereits")
                return
            }
        }

        let newObject = {
            title: title,
            author: author
        }
        $data = [...$data, newObject] 
        console.log($data)
    }

</script>

<HomeButton />

<div>Add Entry</div>

<form on:submit|preventDefault={newEntry} name="form">
    <label for="title"> Titel </label>
    <input type="text" name="title" bind:value={inputField}><br>
    <label for="author"> Autor </label>
    <input type="text" name="author"><br>
    <button type="submit">Go</button>
</form>
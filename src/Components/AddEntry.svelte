<script>
    import { addEntry } from "./DataHandling.js"
    import { data } from "../store.js"
    import HomeButton from "./HomeButton.svelte"

    data.useLocalStorage();

    let inputField

    function go(newTitle){
        let found = false

        for(let i = 0; i < $data.length; i++){
            if($data[i].title === newTitle){
                found = true
                alert("Dieser Eintrag existiert bereits")
                break
            }
        }

        if(found === false){
            let newObject = {
                title: newTitle
            }
            $data = [...$data, newObject] 
            console.log($data)
        }
    }

</script>
<HomeButton />
<div>Add Entry</div>
<div>
    <input type="text" bind:value={inputField}>
    <button on:click={() => go(inputField)}>Go</button>
</div>
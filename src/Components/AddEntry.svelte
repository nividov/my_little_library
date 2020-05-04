<script>
    import { addEntry } from "./DataHandling.js"
    import { data } from "../store.js"
    data.useLocalStorage();

    let inputField

    function go(title){
        let newObject = {
            title: title
        }
        $data = [...$data, newObject] 
        console.log($data)
    }

</script>

<div>Add Entry</div>
<div>
    <input type="text" bind:value={inputField}>
    <button on:click={() => go(inputField)}>Go</button>
</div>
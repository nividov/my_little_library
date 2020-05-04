<script>
	import { push } from 'svelte-spa-router'
    import { addEntry } from "./DataHandling.js"
    import { data } from "../store.js"
    import HomeButton from "./HomeButton.svelte"

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
<HomeButton />
<div>Add Entry</div>
<div>
    <input type="text" bind:value={inputField}>
    <button on:click={() => go(inputField)}>Go</button>
</div>
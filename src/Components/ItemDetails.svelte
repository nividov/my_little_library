<script>
    import { changeEntry } from "./DataHandling.js" 
    import { entries } from "../store.js"
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    export let itemNr
    let entry = $entries[itemNr]

    function closeDetail(){
        dispatch("closeDetail")
    }

</script>

<div class="fixed inset-0">
	<div class="bg-black opacity-50 fixed inset-0 "></div>
        <div class="fixed inset-0 mx-32 px-8 pt-8 my-16 bg-white">
            <div on:click={closeDetail} class="text-right"><span class="cursor-pointer">x</span></div>

            <form 
            on:submit|preventDefault={(e) => {
                changeEntry(e, itemNr)
                closeDetail()
            }}>
                <label for="title"> Titel </label>
                <input type="text" name="title" value={entry.title||""}><br>
                <label for="author"> Autor </label>
                <input type="text" name="author" value={entry.author||""}><br>
                <label for="genre"> Genre </label>
                <input type="text" name="genre" value={entry.genre||""}><br>
                <label for="location"> Standort </label>
                <input type="text" name="location" value={entry.location||""}><br>
                <label for="location"> schon gelesen? </label>
                <input type="checkbox" name="read" bind:checked={entry.read}><br>
                <button type="submit">Save</button>
            </form>
	</div>
</div>

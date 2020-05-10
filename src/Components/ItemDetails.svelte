<script>
    import { changeEntry } from "./DataHandling.js" 
    import { data } from "../store.js"
    import {createEventDispatcher} from 'svelte';
    const dispatch = createEventDispatcher();

    export let itemNr
    let entry = $data[itemNr]

</script>

<div class="fixed inset-0">
	<div class="bg-black opacity-50 fixed inset-0 "></div>
        <div class="fixed inset-0 px-16 pt-8 my-16 text-center">
            <form on:submit|preventDefault={(e) => changeEntry(e, itemNr)} action="">
                <label for="title"> Titel </label>
                <input type="text" name="title" value={entry.title||""}><br>
                <label for="author"> Autor </label>
                <input type="text" name="author" value={entry.author||""}><br>
                <label for="genre"> Genre </label>
                <input type="text" name="genre" value={entry.genre||""}><br>
                <label for="location"> Standort </label>
                <input type="text" name="location" value={entry.location||""}><br>

                <button type="submit">Save</button>
            </form>
        <div on:click={() => dispatch("closeDetail")}>x</div>
	</div>
</div>
<script>
    import { addNewEntry } from "./DataHandling.js" 
    import HomeButton from "./HomeButton.svelte"

</script>

<HomeButton />

<div>Add a new entry</div>

<form on:submit|preventDefault={addNewEntry} name="form">
    <label for="title"> Titel </label>
    <input type="text" name="title"><br>
    <label for="author"> Autor </label>
    <input type="text" name="author"><br>
    <button type="submit">Go</button>
</form>
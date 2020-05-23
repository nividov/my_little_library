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
    <label for="genre"> Genre </label>
    <input type="text" name="genre"><br>
    <label for="location"> Standort </label>
    <input type="text" name="location"><br>
    <label for="location"> schon gelesen? </label>
    <input type="checkbox" name="read"><br>
    <button type="submit"> Los! </button>
</form>
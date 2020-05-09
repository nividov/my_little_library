<script>
    import { data } from "../store.js"
    import HomeButton from "./HomeButton.svelte"
    data.useLocalStorage();

    

</script>
<HomeButton />
<div>BookList</div>
<div>
    <div class="pr-2 w-1/2">Titel - Autor</div>
    {#each $data as item}
        <div class="pr-2 w-1/2">{item.title} - {item.author}</div>
    {/each}
</div>
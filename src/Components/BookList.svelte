<script>
    import { data } from "../store.js"
    import HomeButton from "./HomeButton.svelte"
    data.useLocalStorage();

    

</script>
<HomeButton />
<div>BookList</div>
<div>
    {#each $data as item}

        <div>{item.title}</div>

    {/each}
</div>
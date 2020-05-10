<script>
    import { data } from "../store.js"
    import HomeButton from "./HomeButton.svelte"
    import ItemDetails from "./ItemDetails.svelte"
    data.useLocalStorage();

    let itemDetails = false
    let itemNr

    function showDetail(itemNumber){
        itemDetails = true
        itemNr = itemNumber
    }

</script>

<HomeButton />

<div>BookList</div>
<div>
    <div class="pr-2 w-1/2">Titel - Autor</div>
    {#each $data as item, i}
        <div>{item.title} - {item.author} <span on:click={() => showDetail(i)} class="pl-8"> Bearbeiten</span></div>
    {/each}
</div>

{#if itemDetails}
    <ItemDetails {itemNr} on:closeDetail={() => itemDetails = false}/>
{/if}
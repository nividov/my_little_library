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
    <div class="flex justify-between">
        <div class="flex-1">Titel</div> 
        <div class="flex-1">Autor</div> 
        <div class="flex-1"></div>
    </div>
    {#each $data as item, i}
        <div class="flex justify-between">
            <div class="flex-1">{item.title}</div> 
            <div class="flex-1">{item.author}</div> 
            <div class="flex-1" on:click={() => showDetail(i)}>Bearbeiten</div>
        </div>
    {/each}
</div>

{#if itemDetails}
    <ItemDetails {itemNr} on:closeDetail={() => itemDetails = false}/>
{/if}
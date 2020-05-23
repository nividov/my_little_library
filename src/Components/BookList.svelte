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

    function sorting(key){
        data.sort(key)
    }

</script>

<HomeButton />

<div>BookList</div>
<div>
    <div class="flex justify-between">
        <div class="flex-1">
            Titel 
            <span on:click={() => sorting("title")}>^</span>
        </div> 
        <div class="flex-1">
            Autor
            <span on:click={() => sorting("author")}>^</span>
        </div> 
        <div class="flex-1">
            Genre
            <span on:click={() => sorting("genre")}>^</span>
        </div> 
        <div class="flex-1">
            Standort
            <span on:click={() => sorting("location")}>^</span>
        </div> 
        <div class="flex-1">
            Gelesen?
            <span on:click={() => sorting("read")}>^</span>
        </div> 
        <div class="flex-1"></div>
    </div>
    {#each $data as item, i}
        <div class="flex justify-between">
            <div class="flex-1">{item.title}</div> 
            <div class="flex-1">{item.author || "-"}</div> 
            <div class="flex-1">{item.genre || "-"}</div> 
            <div class="flex-1">{item.location || "-"}</div> 
            <div class="flex-1">
                <input type="checkbox" bind:checked={item.read}>
            </div> 
            <div class="flex-1" on:click={() => showDetail(i)}>Bearbeiten</div>
        </div>
    {/each}
</div>

{#if itemDetails}
    <ItemDetails {itemNr} on:closeDetail={() => itemDetails = false}/>
{/if}
<script>
    import { data } from "../store.js"
    import { onMount } from 'svelte';
    import HomeButton from "./HomeButton.svelte"
    import ItemDetails from "./ItemDetails.svelte"
    data.useLocalStorage();

    onMount(() => {
        sortAsBefore()
	});

    let itemDetails = false
    let itemNr

    function showDetail(itemNumber){
        itemDetails = true
        itemNr = itemNumber
    }
    
    let lastSorted = localStorage.getItem("lastSorted") || "author"
    let sortingDirection = JSON.parse(localStorage.getItem("sortingDirection"))

    function sorting(key){
        localStorage.setItem("lastSorted", key)
        let storageBool = JSON.parse(localStorage.getItem("sortingDirection"))
        localStorage.setItem("sortingDirection", !storageBool)
        sortingDirection = !storageBool
        data.sort(key, sortingDirection)
    }

    function sortAsBefore(){
        data.sort(lastSorted, sortingDirection);
    }

    function detailClosed(){
        itemDetails = false
        sortAsBefore()
    }

</script>

<HomeButton />

<div>BookList</div>
<div>
    <div class="flex justify-between">
        <div class="flex-1">
            Titel 
            <span on:click={() => sorting("title")}>{sortingDirection ? "^" : "v"}</span>
        </div> 
        <div class="flex-1">
            Autor
            <span on:click={() => sorting("author")}>{sortingDirection ? "^" : "v"}</span>
        </div> 
        <div class="flex-1">
            Genre
            <span on:click={() => sorting("genre")}>{sortingDirection ? "^" : "v"}</span>
        </div> 
        <div class="flex-1">
            Standort
            <span on:click={() => sorting("location")}>{sortingDirection ? "^" : "v"}</span>
        </div> 
        <div class="flex-1">
            Gelesen?
            <span on:click={() => sorting("read")}>{sortingDirection ? "^" : "v"}</span>
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
    <ItemDetails {itemNr} on:closeDetail={detailClosed}/>
{/if}
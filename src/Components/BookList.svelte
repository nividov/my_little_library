<script>
    import { get } from 'svelte/store';
    import { push } from 'svelte-spa-router'
    import { entries } from "../store.js"
    import { onMount } from 'svelte';
    import HomeButton from "./HomeButton.svelte"
    import ItemDetails from "./ItemDetails.svelte"
    entries.useLocalStorage();

    onMount(() => {
        sortAsBefore()
	});


    function changePage(destination){
        push(destination)
    }

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
        entries.sort(key, sortingDirection)
    }

    function sortAsBefore(){
        entries.sort(lastSorted, sortingDirection);
    }

    function detailClosed(){
        itemDetails = false
        sortAsBefore()
    }

    function saveData(data) {
        let fileContent = get(data);
        let bb = new Blob([JSON.stringify(fileContent, null, 2)], {type : 'application/json'});
        let a = document.createElement('a');
        a.download = 'download.txt';
        a.href = window.URL.createObjectURL(bb);
        a.click();
    }

</script>

<HomeButton/>
<button on:click={() => changePage("/AddEntry")}>Buch hinzufügen</button>
<button on:click={() => saveData(entries)}>Daten herunterladen</button>

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
    {#each $entries as item, i}
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
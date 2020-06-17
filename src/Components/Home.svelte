<script>

	import { push } from 'svelte-spa-router'

    function changePage(destination){
        push(destination)
    }


</script>


<div>Hello and Welcome to your little library v2</div>
<button on:click={() => changePage("/AddEntry")}>Add entry</button>
<button on:click={() => changePage("/BookList")}>Show list</button>
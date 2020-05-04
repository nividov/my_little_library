<script>
	import Tailwindcss from './Tailwindcss.svelte';
	import Home from './Components/Home.svelte';
	import AddEntry from './Components/AddEntry.svelte';
	import BookList from './Components/BookList.svelte';
	import Router from 'svelte-spa-router'


	const routes = {
		'/': Home,
		"/AddEntry": AddEntry,
		"/BookList": BookList
	}
</script>

<Tailwindcss />

<Router {routes} />

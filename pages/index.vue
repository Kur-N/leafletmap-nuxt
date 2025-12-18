<script setup lang="ts">
import MapContent from '../components/MapContent.vue';
</script>

<template>
	<div>
		<h1 style="padding-left: 14px;">My Map</h1>
        <ClientOnly>
            <MapContent/>
            <template #fallback>
                <p>Map is loading...</p>
            </template>
        </ClientOnly>
	</div>
</template>
<style>
* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

body {
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
		Ubuntu, Cantarell, sans-serif;
}
</style>

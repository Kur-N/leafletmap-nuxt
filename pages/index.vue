<template>
	<div>
		<h1>My Map</h1>

        <ClientOnly>
            <!-- Panggil component -->
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

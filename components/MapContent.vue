<script setup>
import {
	ref,
	onMounted,
	nextTick,
	computed,
	watch,
	shallowRef,
	onBeforeUnmount,
} from "vue";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import "leaflet-editable";
import * as turf from "@turf/turf";

const mapId = "map";
const drawMode = ref(null);
const currentAction = ref("none");
const currentEditingLayer = shallowRef(null);
const originalEditingFeature = shallowRef(null);
const newLayerCode = ref("");
const currentZoom = ref(5);
const debugMessage = ref("");
const isZoomingToLayer = ref(false);

const mapContainerRef = ref(null); // Ref untuk elemen div peta
const isFullscreen = ref(false); // State untuk melacak status fullscreen

const drawnItems = L.featureGroup();
const mapInstance = shallowRef(null);
const geoJsonLayer = shallowRef(null);
const radiusLayer = shallowRef(null);
const centerMarker = shallowRef(null);
const currentDrawHandler = shallowRef(null);
const currentLayerMapping = ref(new Map());

const toggleFullscreen = () => {
    const element = mapContainerRef.value;

    if (document.fullscreenElement) {
        // Jika sudah fullscreen, keluar dari mode fullscreen
        document.exitFullscreen();
        isFullscreen.value = false;
    } else if (element) {
        // Jika belum, masuk mode fullscreen
        element.requestFullscreen().catch(err => {
            alert(`Error: Tidak dapat mengaktifkan mode fullscreen. ${err.message} (${err.name})`);
        });
        isFullscreen.value = true;
    }
};

// 🛑 Penting: Atur listener untuk event exit fullscreen
// Agar state isFullscreen.value diperbarui saat pengguna menekan ESC
document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement;
});

// Ketika beralih ke/keluar dari fullscreen, Leaflet mungkin perlu 
// menyesuaikan kembali ukuran tile-nya:
document.addEventListener('fullscreenchange', () => {
    // Dipanggil setelah transisi selesai
    setTimeout(() => {
        if (mapInstance.value) {
            mapInstance.value.invalidateSize();
        }
    }, 100); 
});

onMounted(async () => {
	const L = (await import("leaflet")).default;
	await import("leaflet-draw");
	await import("leaflet-editable");

	drawnItems.value = new L.FeatureGroup();

	// const southWest = L.latLng(-15.0, 90.0);
	// const northEast = L.latLng(10.0, 145.0);
	// const indonesiaBounds = L.latLngBounds(southWest, northEast);
	const centerPoint = L.latLng(-7.5324677, 110.6012167); // Fokus sedikit di bawah ekuator
	const initialZoom = 18;
	mapInstance.value = L.map(mapId, {
		editable: true,
		// maxBounds: indonesiaBounds,
		minZoom: initialZoom,
		maxZoom: 18,
	}).setView(centerPoint, initialZoom);

	delete L.Icon.Default.prototype._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl:
			"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
		iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
		shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
	});
	L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution: "© OpenStreetMap",
	}).addTo(mapInstance.value);

	mapInstance.value.addLayer(drawnItems);

	nextTick(() => {
		attachDrawAndEditableListeners();
		updateMapState();
	});
});

onBeforeUnmount(() => {
	if (mapInstance.value) {
		mapInstance.value.off();
		mapInstance.value.remove();
	}
});
</script>
<template>
	<div
		style="
			font-family: Arial, sans-serif;
			display: flex;
			flex-direction: column;
			height: 98vh;
		"
	>
		<div
			id="map-wrapper"
			ref="mapContainerRef"
			style="position: relative"
		>
			<div
				:id="mapId"
				style="flex-grow: 1; height: 100%"
			>
				<button
					@click="toggleFullscreen"
					class="fullscreen-control-custom"
					:title="isFullscreen ? 'Keluar Fullscreen' : 'Lihat Fullscreen'"
				>
					<i
						:class="[
							'mdi',
							isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen',
						]"
					></i>
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* 🛑 Styling Tombol Fullscreen Kustom */
.fullscreen-control-custom {
	/* Posisi absolut relatif terhadap #map-wrapper */
	position: absolute;

	/* 🛑 Posisi KIRI ATAS, tepat di bawah kontrol zoom Leaflet bawaan */
	top: 80px; /* Sesuaikan nilai ini. Jika kontrol zoom bawaan tingginya 65px (termasuk margin), ini akan menempatkannya tepat di bawahnya. */
	left: 10px;

	z-index: 600; /* Di atas elemen peta */

	/* Meniru Style Kontrol Leaflet Standar */
	width: 33px;
	height: 30px;

	/* Tampilan tombol */
	display: flex;
	justify-content: center;
	align-items: center;

	background-color: white;
	color: #333; /* Warna ikon */
	cursor: pointer;

	/* Meniru border dan shadow bawaan Leaflet */
	border: 2px solid rgba(0, 0, 0, 0.2);
	background-clip: padding-box;
	border-radius: 2px;
	padding-top: 1px;

	/* box-shadow: 0 1px 5px rgba(0, 0, 0, 0.2);  */

	/* Garis pemisah opsional di bagian atas jika ingin menempel dengan zoom control */
	/* border-top: 1px solid #ccc;  */
}

.fullscreen-control-custom:hover {
	background-color: #f4f4f4;
}

/* Ukuran ikon MDI */
.fullscreen-control-custom i {
	font-size: 22px;
}
#map-wrapper {
	flex-grow: 1;
	width: 100%;
	margin: 0 auto; /* Tengah secara Horizontal */
	padding: 0 15px; /* Opsional: sedikit padding samping */
	box-sizing: border-box; /* Pastikan padding tidak menambah lebar */
	/* Tambahkan Flex untuk memastikan map mengisi tinggi yang tersisa */
	display: flex;
	margin-top: 12px;
	margin-bottom: 50px;
}
</style>

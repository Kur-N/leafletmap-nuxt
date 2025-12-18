// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: false },
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
        },
        {
          rel: 'stylesheet',
          href: 'https://unpkg.com/leaflet-draw@1.0.4/dist/leaflet.draw.css',
        },
      ],
    },
  },
  vite: {
    optimizeDeps: {
      include: ['leaflet', 'leaflet-draw'],
    },
  },
  css: [
    '@mdi/font/css/materialdesignicons.min.css'
  ],
})

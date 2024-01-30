import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import VElement from 'fri-element-plus'
import i18n from './locales'

import 'fri-element-plus/dist/index.css'
import 'tailwindcss/tailwind.css'
import './styles/index.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia).use(i18n).use(VElement).mount('#app')

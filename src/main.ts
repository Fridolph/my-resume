import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
// import VElement from 'fri-element-plus'
import i18n from './locales'
import { print } from './utils/console'
import 'tailwindcss/tailwind.css'
import './styles/index.css'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia).use(i18n).mount('#app')

print()

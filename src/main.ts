import { createApp } from 'vue'
import App from './App.vue'
import VElement from 'fri-element-plus'
import i18n from './locales'
import { print } from './utils/console'

import 'fri-element-plus/dist/index.css'
import 'tailwindcss/tailwind.css'
import './styles/index.css'

const app = createApp(App)

app.use(i18n).use(VElement).mount('#app')
print()
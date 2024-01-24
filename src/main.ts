import { createApp } from 'vue'
import VElement from 'fri-element-plus'
import App from './App.vue'

import 'fri-element-plus/dist/index.css'
import "tailwindcss/tailwind.css"
import './styles/index.css'

const app = createApp(App)

app.use(VElement)
app.mount('#app')

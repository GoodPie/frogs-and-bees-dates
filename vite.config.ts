import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'

import { viteAliases } from './config/paths'

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: viteAliases,
    },
})

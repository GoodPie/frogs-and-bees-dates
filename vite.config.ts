import react from '@vitejs/plugin-react-swc'
import path from 'path'
import {fileURLToPath} from 'node:url'
import {defineConfig} from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
})

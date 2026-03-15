import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
    },  // 使用 vue 插件
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://118.145.239.110:5411',
        changeOrigin: true,
      //  rewrite: (path) => path.replace(/^\/api/, '')
      
      }
    }
  }
})

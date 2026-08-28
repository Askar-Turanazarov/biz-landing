import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Проксируем API на backend: и CORS не мешает, и адрес не приходится хардкодить.
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    // three попадает в отдельный ленивый чанк и на первую отрисовку не влияет,
    // поэтому предупреждение о его размере здесь только шумит.
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Разносим тяжёлые куски: three грузится только на мощных устройствах,
        // админка — только на скрытом маршруте.
        manualChunks(id) {
          // Хелпер динамических импортов Vite нужен точке входа. Без явного
          // правила Rollup прячет его внутрь самого крупного общего чанка —
          // и точка входа начинает статически импортировать three.
          if (id.includes('vite/preload-helper')) return 'preload-helper';
          if (!id.includes('node_modules')) return;
          // zustand — обязательно ДО three: его используют и наши сторы, и
          // @react-three/fiber. Без явного правила Rollup кладёт общий модуль
          // внутрь чанка three, тот попадает в modulepreload в index.html,
          // и 220 КБ WebGL скачиваются даже там, где canvas не монтируется.
          if (/[\\/]node_modules[\\/]zustand[\\/]/.test(id)) return 'state';
          if (/[\\/]node_modules[\\/](three|@react-three)[\\/]/.test(id)) return 'three';
          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) return 'motion';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/]node_modules[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id))
            return 'router';
        },
      },
    },
  },
});

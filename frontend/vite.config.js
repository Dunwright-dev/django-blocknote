import { defineConfig } from 'vite'

const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/blocknote.js',
      name: 'DjangoBlockNote',
      fileName: 'blocknote',
      formats: ['iife']
    },
    outDir: '../django_blocknote/static/django_blocknote',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        entryFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name].[hash][extname]'
          }
          return '[name].[hash][extname]'
        }
      }
    },
    sourcemap: !isProduction,
    minify: isProduction ? 'terser' : false,
    terserOptions: isProduction ? {
      compress: {
        passes: 2,
        drop_console: true,
        drop_debugger: true
      }
    } : undefined,
    manifest: true
  },
  
  css: {
    devSourcemap: false
  },
  
  server: {
    port: 5174
  },
  esbuild: {
    drop: isProduction ? ['console', 'debugger'] : []
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})

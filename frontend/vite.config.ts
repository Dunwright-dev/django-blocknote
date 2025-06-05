import { defineConfig } from 'vite'
const isProduction = process.env.NODE_ENV === 'production'

export default defineConfig({
  build: {
    lib: {
      entry: './src/blocknote.ts',
      name: 'DjangoBlockNote',
      fileName: 'blocknote',
      formats: ['iife']
    },
    outDir: '../django_blocknote/static/django_blocknote',
    emptyOutDir: true,
    target: 'es2022',
    rollupOptions: {
      external: [],
      onwarn(warning, warn) {
        // Suppress "use client" directive warnings from Mantine
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) {
          return
        }
        // Suppress sourcemap warnings from Mantine
        if (warning.code === 'SOURCEMAP_ERROR' && warning.message.includes("Can't resolve original location")) {
          return
        }
        // Show other warnings
        warn(warning)
      },
      output: {
        globals: {},
        entryFileNames: 'js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.names && assetInfo.names.some(name => name.endsWith('.css'))) {
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
  // TypeScript and ES2022 configuration
  esbuild: {
    target: 'es2022', // ES2022 support
    drop: isProduction ? ['console', 'debugger'] : []
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})

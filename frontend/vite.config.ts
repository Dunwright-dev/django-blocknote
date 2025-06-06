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
      // Bundle everything - no externals for Django compatibility
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
        },
        // Add an outro to expose React and ReactDOM globally
        outro: `
          // Expose React and ReactDOM globally for Django compatibility
          if (typeof window !== 'undefined') {
            // Extract React from the bundle and expose it globally
            const ReactModule = DjangoBlockNote._internal?.React;
            const ReactDOMModule = DjangoBlockNote._internal?.ReactDOM;
            
            if (ReactModule && !window.React) {
              window.React = ReactModule;
              console.log('✅ React exposed globally from DjangoBlockNote bundle');
            }
            
            if (ReactDOMModule && !window.ReactDOM) {
              window.ReactDOM = ReactDOMModule;
              console.log('✅ ReactDOM exposed globally from DjangoBlockNote bundle');
            }
          }
        `
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
    target: 'es2022',
    drop: isProduction ? ['console', 'debugger'] : []
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})

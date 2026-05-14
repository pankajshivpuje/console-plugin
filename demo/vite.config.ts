import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function sdkAliasPlugin() {
  const sdkMock = path.resolve(__dirname, 'src/mocks/sdk.tsx');
  const sdkInternalMock = path.resolve(__dirname, 'src/mocks/sdk-internal.tsx');
  const sdkDeepMock = path.resolve(__dirname, 'src/mocks/sdk-deep.ts');

  return {
    name: 'sdk-alias-resolver',
    enforce: 'pre' as const,
    resolveId(source: string) {
      // Deep imports from SDK (must check before exact match)
      if (
        source.startsWith('@openshift-console/dynamic-plugin-sdk-internal/')
      ) {
        return sdkInternalMock;
      }
      if (source.startsWith('@openshift-console/dynamic-plugin-sdk/')) {
        return sdkDeepMock;
      }
      if (source.startsWith('@openshift-console/dynamic-plugin-sdk-webpack')) {
        return sdkMock;
      }
      // Exact matches
      if (source === '@openshift-console/dynamic-plugin-sdk-internal') {
        return sdkInternalMock;
      }
      if (source === '@openshift-console/dynamic-plugin-sdk') {
        return sdkMock;
      }
      // Resolve @patternfly/* from demo's node_modules to avoid parent hoisting issues
      if (source.startsWith('@patternfly/')) {
        try {
          return require.resolve(source, { paths: [path.resolve(__dirname, 'node_modules')] });
        } catch {
          return null;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  base: '/console-plugin/',
  plugins: [sdkAliasPlugin(), react()],
  resolve: {
    alias: {
      'i18next': path.resolve(__dirname, 'node_modules/i18next'),
      'react-i18next': path.resolve(__dirname, 'node_modules/react-i18next'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router': path.resolve(__dirname, 'node_modules/react-router'),
      'react-redux': path.resolve(__dirname, 'node_modules/react-redux'),
      '@reduxjs/toolkit': path.resolve(__dirname, 'node_modules/@reduxjs/toolkit'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});

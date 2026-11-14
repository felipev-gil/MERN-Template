import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import daisyui from 'daisyui';

export default defineConfig({
  css: { postcss: { plugins: [tailwindcss({
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: { extend: {} },
    plugins: [daisyui],
    daisyui: { themes: ['light'], logs: false },
  })] } },
});


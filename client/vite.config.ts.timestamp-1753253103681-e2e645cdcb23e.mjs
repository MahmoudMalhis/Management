// vite.config.ts
import { defineConfig } from "file:///D:/Management%20Web%20App%20Design/workspace/shadcn-ui/node_modules/.pnpm/vite@5.4.19_@types+node@22.15.17/node_modules/vite/dist/node/index.js";
import react from "file:///D:/Management%20Web%20App%20Design/workspace/shadcn-ui/node_modules/.pnpm/@vitejs+plugin-react-swc@3.9.0_vite@5.4.19/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "path";
var __vite_injected_original_dirname =
  "D:\\Management Web App Design\\workspace\\shadcn-ui";
var vite_config_default = defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
    },
  },
}));
export { vite_config_default as default };

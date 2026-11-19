import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Port 5180 (not Vite's default 5173) so ChessLab does not collide with other projects on this machine.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: true },
  preview: { port: 5180, strictPort: true },
});

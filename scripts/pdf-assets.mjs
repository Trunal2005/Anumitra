import { cpSync, mkdirSync } from "node:fs";
for (const directory of ["cmaps", "standard_fonts", "wasm"]) {
  mkdirSync("apps/web/public/pdf-assets", { recursive: true });
  cpSync(
    `node_modules/pdfjs-dist/${directory}`,
    `apps/web/public/pdf-assets/${directory}`,
    { recursive: true },
  );
}

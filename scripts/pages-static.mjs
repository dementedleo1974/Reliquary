import { copyFileSync, existsSync, writeFileSync } from "node:fs";

const index = ".vercel/output/static/index.html";
if (!existsSync(index)) {
  console.error("missing", index);
  process.exit(1);
}
copyFileSync(index, ".vercel/output/static/404.html");
writeFileSync(".vercel/output/static/.nojekyll", "");
console.log("pages static ready");

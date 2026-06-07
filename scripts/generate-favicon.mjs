/**
 * 从 app/icon.png（与主仓 electron/resources/icon.png 同步）生成 app/favicon.ico。
 * 依赖：png-to-ico（devDependency）
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const input = path.join(root, "app", "icon.png");
const output = path.join(root, "app", "favicon.ico");

const buf = await pngToIco(input);
fs.writeFileSync(output, buf);
console.log("Wrote", output);

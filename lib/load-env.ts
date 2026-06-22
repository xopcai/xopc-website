import { config } from "dotenv";
import path from "node:path";

/**
 * 从项目根目录加载 .env（与 Next 一致：`.env.${mode}.local` → `.env.local` → `.env.${mode}` → `.env`）。
 * dotenv 默认不覆盖已存在的 process.env，故按「优先级从高到低」依次加载，先载入的键生效。
 * 便于 PM2 等场景在服务器项目根目录放置 .env 而无需改启动命令。
 */
export function loadEnvFiles(): void {
  const root = /* turbopackIgnore: true */ process.cwd();
  const mode = process.env.NODE_ENV ?? "development";
  const files = [
    path.join(root, `.env.${mode}.local`),
    path.join(root, ".env.local"),
    path.join(root, `.env.${mode}`),
    path.join(root, ".env"),
  ];
  const quiet = process.env.DOTENV_DEBUG !== "1";
  for (const filepath of files) {
    config({ path: filepath, quiet });
  }
}

/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * PM2 配置：直接启动 Next 二进制，避免 `pnpm start -- -p …` 被展开为
 * `next start -- -p …`（pnpm 会插入 `--`），在 Next.js 16 下会把 `-p` 当成项目目录。
 * 端口使用环境变量 PORT（默认 3000）。
 */
const path = require("path");

module.exports = {
  apps: [
    {
      name: "xopc-website",
      cwd: __dirname,
      script: path.join(__dirname, "node_modules/next/dist/bin/next"),
      args: ["start"],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
};

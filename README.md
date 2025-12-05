
# 跨境贸易利润计算器 - Cloudflare一键部署指南

## 项目结构

```
.
├── deploy/
├── img/
│   ├── zh/
│   └── en/
├── pages/
├── worker/
├── ORANGE_CLOUD_DEPLOYMENT.md
├── README.md
└── README_EN.md
```

## 前置准备

1. 注册Cloudflare账号：https://dash.cloudflare.com/
2. 获取Fixer API Key：https://apilayer.com/marketplace/fixer-api
3. 安装Node.js + Wrangler CLI：
   ```bash
   npm install -g wrangler
   wrangler login # 登录Cloudflare账号
   ```

## 部署步骤

1. 修改 `worker/wrangler.toml` 文件，将 `FIXER_API_KEY` 替换为您自己的API Key
2. 项目已配置KV命名空间绑定到"sciboyea"，如果您需要使用不同的KV命名空间，请在 `worker/wrangler.toml` 中修改相应的ID
3. 运行部署脚本：
   - Windows系统：双击运行 `deploy.bat`
   - Mac/Linux系统：在终端中执行 `./deploy.sh`
4. 部署完成后，将 `pages/index.html` 中的 `WORKER_URL` 替换为您的Worker域名
5. 将 `pages` 目录下的所有文件上传到您的网站服务器或静态托管服务
6. 确保 `img` 目录及其子目录（`zh` 和 `en`）一同部署，以便正确显示图片资源

## 本地开发

```bash
# 运行本地Python应用
python main.py

# 运行Cloudflare Worker本地调试
cd worker
wrangler dev

# 或者使用npm脚本
npm run dev
```

## 测试KV功能

在本地开发模式下运行Worker后，可以使用提供的测试脚本验证KV功能：

```bash
node test_kv.js
```

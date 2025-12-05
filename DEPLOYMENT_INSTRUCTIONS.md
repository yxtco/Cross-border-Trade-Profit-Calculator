# 部署说明 / Deployment Instructions

## 中文部署说明

### 1. 前置准备
1. 注册橙云账户
2. 获取Fixer API Key：https://apilayer.com/marketplace/fixer-api
3. 安装Node.js（版本14或更高）
4. 安装橙云CLI工具

### 2. 后端部署步骤
1. 进入 `worker` 目录
2. 修改 `wrangler.toml` 文件，将 `FIXER_API_KEY` 替换为您自己的API Key
3. 在橙云控制台创建新的KV命名空间
4. 更新 `wrangler.toml` 文件中的KV命名空间ID
5. 使用橙云CLI部署Worker：
   ```
   orange-cloud deploy
   ```
6. 记录部署后的Worker URL

### 3. 前端部署步骤
1. 进入 `pages` 目录
2. 修改 `script.js` 文件中的 `WORKER_URL` 为您的Worker域名
3. 打包目录中的所有文件用于部署
4. 将打包文件上传到橙云静态托管服务
5. 在橙云控制台配置域名设置
6. 确保 `img` 目录及其子目录（`zh` 和 `en`）一同部署

### 4. 环境变量配置
- `FIXER_API_KEY`: 您的Fixer API密钥，用于获取汇率数据
- `API_KEY`: 用于验证KV操作的固定API密钥（默认已提供）

---

## English Deployment Instructions

### 1. Prerequisites
1. Orange Cloud account
2. Fixer API Key from https://apilayer.com/marketplace/fixer-api
3. Node.js (version 14 or higher)
4. Orange Cloud CLI tool installation

### 2. Backend Deployment Steps
1. Navigate to the `worker` directory
2. Update the `wrangler.toml` file with your Fixer API Key:
   ```toml
   [vars]
   FIXER_API_KEY = "your_actual_api_key_here"
   ```
3. Create a new KV namespace in your Orange Cloud dashboard
4. Update the `wrangler.toml` file with your KV namespace ID:
   ```toml
   [[kv_namespaces]]
   binding = "PROFIT_CALC_KV"
   id = "your_kv_namespace_id_here"
   ```
5. Deploy the Worker using the Orange Cloud CLI:
   ```bash
   orange-cloud deploy
   ```
6. Note the deployed Worker URL

### 3. Frontend Deployment Steps
1. Navigate to the `pages` directory
2. Update the `WORKER_URL` constant in `script.js` with your deployed Worker URL:
   ```javascript
   const CONFIG = {
       WORKER_URL: "https://your-worker-url.orange-cloud.com",
       // ... other configuration
   };
   ```
3. Package all files in this directory for deployment
4. Upload the packaged files to your Orange Cloud static hosting service
5. Configure your domain settings in the Orange Cloud dashboard
6. Ensure the `img` directory and its subdirectories (`zh` and `en`) are included in the deployment

### 4. Environment Variables
- `FIXER_API_KEY`: Your Fixer API key for exchange rate data
- `API_KEY`: Fixed API key for authenticating KV operations (default provided)
# GitHub 部署指南 / GitHub Deployment Guide

## 中文说明

### 1. 在GitHub上创建新仓库
1. 登录您的GitHub账户
2. 点击右上角的 "+" 号，选择 "New repository"
3. 仓库名称建议使用：`cross-border-profit-calculator`
4. 描述可以填写："跨境贸易利润计算器 - 支持Cloudflare和橙云一键部署"
5. 选择公开（Public）或私有（Private）
6. 不要初始化README、.gitignore或license
7. 点击 "Create repository"

### 2. 将本地代码推送到GitHub
1. 在本地项目目录中打开终端
2. 添加GitHub远程仓库地址（请将 `your-username` 替换为您的GitHub用户名）：
   ```bash
   git remote add origin https://github.com/your-username/cross-border-profit-calculator.git
   ```
3. 推送代码到GitHub：
   ```bash
   git push -u origin main
   ```

### 3. 验证推送结果
1. 访问您的GitHub仓库页面
2. 确认所有文件都已成功上传
3. 检查README文件是否正确渲染

---

## English Instructions

### 1. Create a New Repository on GitHub
1. Log in to your GitHub account
2. Click the "+" icon in the top right corner and select "New repository"
3. Suggested repository name: `cross-border-profit-calculator`
4. Description: "Cross-border trade profit calculator with Cloudflare and Orange Cloud one-click deployment"
5. Choose Public or Private
6. Do not initialize with README, .gitignore, or license
7. Click "Create repository"

### 2. Push Local Code to GitHub
1. Open terminal in your local project directory
2. Add the GitHub remote repository URL (replace `your-username` with your actual GitHub username):
   ```bash
   git remote add origin https://github.com/your-username/cross-border-profit-calculator.git
   ```
3. Push the code to GitHub:
   ```bash
   git push -u origin main
   ```

### 3. Verify the Push Results
1. Visit your GitHub repository page
2. Confirm that all files have been uploaded successfully
3. Check that the README file renders correctly

## 故障排除 / Troubleshooting

### 如果遇到权限错误 / If you encounter permission errors:
- 确保您使用的是正确的GitHub凭据
- 考虑使用GitHub Personal Access Token而不是密码

### 如果遇到网络问题 / If you encounter network issues:
- 尝试使用SSH而不是HTTPS连接
- 配置Git代理设置（如果在受限网络环境中）

### 如果推送被拒绝 / If the push is rejected:
- 确保远程仓库是空的或者您有权限推送到该分支
- 考虑使用 `git push --force` （谨慎使用，会覆盖远程历史）
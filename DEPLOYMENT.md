# 部署指南

## 系统要求
- Node.js 20.x
- ffmpeg (用于视频生成)

## 部署步骤

### 1. 安装系统依赖
```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装必要的系统依赖
sudo apt install -y ffmpeg curl

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
ffmpeg -version
```

### 2. 部署项目代码
```bash
# 创建项目目录
mkdir -p /var/www/photo-album
cd /var/www/photo-album

# 克隆项目代码 (替换为您的仓库地址)
git clone <your-repository-url> .

# 安装项目依赖
npm install

# 构建项目
npm run build
```

### 3. 配置环境变量
创建 `.env` 文件并配置必要的环境变量：
```bash
touch .env
```

添加以下内容：
```env
NODE_ENV=production
PORT=5000
```

### 4. 使用PM2运行应用
```bash
# 安装PM2
sudo npm install -g pm2

# 启动应用
pm2 start dist/index.js --name photo-album

# 设置开机自启
pm2 startup
pm2 save

# 查看应用状态
pm2 status
```

### 5. 配置Nginx (可选，用于反向代理)
```bash
# 安装Nginx
sudo apt install -y nginx

# 创建Nginx配置
sudo nano /etc/nginx/sites-available/photo-album
```

添加以下配置：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 启用站点配置
sudo ln -s /etc/nginx/sites-available/photo-album /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 维护命令

### 更新应用
```bash
# 拉取最新代码
git pull

# 安装依赖
npm install

# 重新构建
npm run build

# 重启应用
pm2 restart photo-album
```

### 查看日志
```bash
# 查看应用日志
pm2 logs photo-album

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 检查应用状态
```bash
# 检查Node应用状态
pm2 status
pm2 show photo-album

# 检查Nginx状态
sudo systemctl status nginx
```

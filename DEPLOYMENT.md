# 部署指南

## 系统要求
- Node.js 20.x
- PostgreSQL 数据库
- ffmpeg (用于视频生成)

## 部署步骤

### 1. 安装系统依赖
```bash
# 更新系统包
sudo apt update
sudo apt upgrade -y

# 安装必要的系统依赖
sudo apt install -y ffmpeg curl postgresql postgresql-contrib

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node --version
npm --version
ffmpeg -version
```

### 2. 配置 PostgreSQL 数据库
```bash
# 启动并启用 PostgreSQL 服务
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库用户和数据库
sudo -u postgres psql -c "CREATE USER photoalbum WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE photoalbum_db OWNER photoalbum;"
```

### 3. 部署项目代码
```bash
# 创建项目目录
mkdir -p /var/www/photo-album
cd /var/www/photo-album

# 克隆项目代码 (替换为您的仓库地址)
git clone <your-repository-url> .

# 安装项目依赖
npm install
```

### 4. 配置环境变量
创建 `.env` 文件并配置必要的环境变量：
```bash
touch .env
```

添加以下内容：
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://photoalbum:your_password@localhost:5432/photoalbum_db
```

### 5. 初始化数据库
```bash
# 运行数据库迁移
npm run db:push
```

### 6. 构建项目
```bash
npm run build
```

### 7. 使用PM2运行应用
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

### 8. 配置Nginx (可选，用于反向代理)
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

    # 配置较大的上传限制
    client_max_body_size 10M;
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
# 进入应用目录
cd /var/www/photo-album

# 拉取最新代码
git pull

# 安装依赖
npm install

# 运行数据库迁移
npm run db:push

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

# 检查PostgreSQL状态
sudo systemctl status postgresql
```

### 备份数据库
```bash
# 创建数据库备份
pg_dump -U photoalbum photoalbum_db > backup.sql

# 恢复数据库备份
psql -U photoalbum photoalbum_db < backup.sql
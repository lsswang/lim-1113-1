#!/bin/bash

echo "🏗️  租户装修图纸会审系统 - 启动脚本"
echo "=========================================="

echo ""
echo "📦 安装后端依赖..."
cd backend
npm install

echo ""
echo "🌱 初始化样例数据..."
node src/seed.js

echo ""
echo "📦 安装前端依赖..."
cd ../frontend
npm install

echo ""
echo "🔨 构建前端..."
npm run build

echo ""
echo "🚀 启动服务..."
cd ..
npm run dev

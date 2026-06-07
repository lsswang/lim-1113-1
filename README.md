# 租户装修图纸会审系统

商办租户装修图纸会审完整流程系统。

## 功能特性

### 角色与流程
1. **租户端**: 提交装修申请、上传图纸、选择噪声作业时段
2. **物业工程师**: 会审图纸、填写审核意见
3. **安保**: 核发施工许可证、设定施工时段

### 核心业务规则
- ✅ **消防图强制检查**: 未上传消防图不能通过会审
- ✅ **噪声时段限制**: 噪声作业只能在允许时段（09:00-12:00, 14:00-18:00）
- ✅ **图纸锁定**: 施工证核发后图纸不可替换

### 状态流转
```
草稿 → 已提交 → 会审通过/驳回 → 待核发施工证 → 施工证已核发
```

## 快速启动

### 方式一：Docker 启动
```bash
docker-compose up -d
```
访问: http://localhost:3001

### 方式二：本地开发
```bash
chmod +x start.sh
./start.sh
```

或手动执行：
```bash
# 安装依赖
npm install

# 初始化样例数据
cd backend && npm run seed && cd ..

# 启动开发服务
npm run dev
```

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

## 冒烟测试

运行核心场景测试：
```bash
cd backend
npm test
```

测试场景：
1. 创建装修申请
2. **未上传消防图 - 会审失败**（核心冒烟场景）
3. 噪声作业时间验证
4. 施工证核发后图纸不可替换

## 样例账号

| 角色 | 用户名 | 说明 |
|------|--------|------|
| 租户 | tenant_zhang | 星辰科技有限公司 (A座1501) |
| 租户 | tenant_li | 云端网络科技 (B座805) |
| 工程师 | engineer_wang | 王工程师 |
| 安保 | security_liu | 刘安保 |

## API 接口

### 申请管理
- `GET /api/applications` - 获取申请列表
- `GET /api/applications/:id` - 获取申请详情
- `POST /api/applications` - 创建申请
- `POST /api/applications/:id/submit` - 提交申请
- `POST /api/applications/:id/review` - 会审
- `POST /api/applications/:id/issue-permit` - 核发施工证

### 图纸管理
- `POST /api/applications/:id/drawings` - 上传图纸
- `DELETE /api/applications/drawings/:drawingId` - 删除图纸

### 配置
- `GET /api/config` - 获取系统配置

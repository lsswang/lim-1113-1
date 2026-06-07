const assert = require('assert');
const fs = require('fs');
const path = require('path');
const db = require('../src/db');
const seedDatabase = require('../src/seed');
const applicationService = require('../src/services/applicationService');

function runTests() {
  console.log('='.repeat(60));
  console.log('冒烟测试: 租户装修图纸会审系统');
  console.log('='.repeat(60));
  
  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  
  db.resetDatabase();
  
  const seedData = seedDatabase();
  let passed = 0;
  let failed = 0;

  console.log('\n--- 测试场景 1: 创建装修申请 ---');
  try {
    const app = applicationService.createApplication(seedData.tenant1Id, {
      title: '测试装修申请 - 冒烟测试',
      description: '这是一个冒烟测试的申请'
    });
    assert.ok(app.id, '申请ID应存在');
    assert.strictEqual(app.status, 'draft', '初始状态应为草稿');
    console.log('✓ 测试场景 1 通过: 创建装修申请成功');
    passed++;
  } catch (e) {
    console.log('✗ 测试场景 1 失败:', e.message);
    failed++;
  }

  console.log('\n--- 测试场景 2: 未上传消防图 - 会审失败 (核心冒烟场景) ---');
  try {
    const testApp = applicationService.createApplication(seedData.tenant1Id, {
      title: '缺少消防图的测试申请',
      description: '这个申请只有平面图，没有消防图'
    });
    
    const drawingId = require('uuid').v4();
    db.insert('drawings', {
      id: drawingId,
      application_id: testApp.id,
      type: 'floor_plan',
      file_name: '平面图.pdf',
      file_path: 'test_floor.pdf',
      uploaded_at: new Date().toISOString()
    });
    
    applicationService.submitApplication(testApp.id, {
      has_noise_work: 0,
      noise_time_slots: []
    });
    
    try {
      applicationService.reviewApplication(testApp.id, seedData.engineerId, {
        status: 'approved',
        comments: '看起来不错'
      });
      console.log('✗ 测试场景 2 失败: 缺少消防图应该会审失败，但成功了');
      failed++;
    } catch (e) {
      assert.ok(e.message.includes('缺少消防图纸'), '错误信息应提及缺少消防图纸');
      console.log('✓ 测试场景 2 通过: 未上传消防图会审失败，错误信息:', e.message);
      passed++;
    }
  } catch (e) {
    console.log('✗ 测试场景 2 失败:', e.message);
    failed++;
  }

  console.log('\n--- 测试场景 3: 噪声作业时间验证 ---');
  try {
    const testApp = applicationService.createApplication(seedData.tenant1Id, {
      title: '噪声测试申请',
      description: '测试噪声时间验证'
    });
    
    try {
      applicationService.submitApplication(testApp.id, {
        has_noise_work: 1,
        noise_time_slots: [{ start: '20:00', end: '22:00' }]
      });
      console.log('✗ 测试场景 3 失败: 非允许时段噪声作业应该失败');
      failed++;
    } catch (e) {
      assert.ok(e.message.includes('不在允许时段内'), '错误信息应提及时段问题');
      console.log('✓ 测试场景 3 通过: 非允许时段噪声作业被拦截，错误信息:', e.message);
      passed++;
    }
  } catch (e) {
    console.log('✗ 测试场景 3 失败:', e.message);
    failed++;
  }

  console.log('\n--- 测试场景 4: 施工证核发后图纸不可替换 ---');
  try {
    const testApp = applicationService.createApplication(seedData.tenant1Id, {
      title: '施工证测试申请',
      description: '测试施工证后图纸锁定'
    });
    
    const fireDrawingId = require('uuid').v4();
    db.insert('drawings', {
      id: fireDrawingId,
      application_id: testApp.id,
      type: 'fire_safety',
      file_name: '消防图.pdf',
      file_path: 'test_fire.pdf',
      uploaded_at: new Date().toISOString()
    });
    
    applicationService.submitApplication(testApp.id, { has_noise_work: 0 });
    
    applicationService.reviewApplication(testApp.id, seedData.engineerId, {
      status: 'approved',
      comments: '通过'
    });
    
    applicationService.issuePermit(testApp.id, seedData.securityId, {
      valid_from: '2024-01-01',
      valid_to: '2024-01-15'
    });
    
    try {
      applicationService.addDrawing(testApp.id, {
        type: 'electrical',
        file_name: '电路图.pdf',
        file_path: 'test_electric.pdf'
      });
      console.log('✗ 测试场景 4 失败: 施工证核发后应该不能添加图纸');
      failed++;
    } catch (e) {
      assert.ok(e.message.includes('施工证已核发'), '错误信息应提及施工证');
      console.log('✓ 测试场景 4 通过: 施工证核发后图纸不可替换，错误信息:', e.message);
      passed++;
    }
  } catch (e) {
    console.log('✗ 测试场景 4 失败:', e.message);
    failed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log(`测试结果: 通过 ${passed} 项, 失败 ${failed} 项`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 所有冒烟测试通过！');
  }
}

runTests();

const { v4: uuidv4 } = require('uuid');
const db = require('./db');

function seedDatabase() {
  console.log('开始初始化样例数据...');

  const tenant1Id = uuidv4();
  const tenant2Id = uuidv4();
  
  const existingTenants = db.findAll('tenants');
  if (existingTenants.length === 0) {
    db.insert('tenants', {
      id: tenant1Id,
      name: '星辰科技有限公司',
      room_number: 'A座1501',
      contact_person: '张经理',
      contact_phone: '13800138001',
      created_at: new Date().toISOString()
    });
    
    db.insert('tenants', {
      id: tenant2Id,
      name: '云端网络科技',
      room_number: 'B座805',
      contact_person: '李主管',
      contact_phone: '13800138002',
      created_at: new Date().toISOString()
    });
  }

  const existingUsers = db.findAll('users');
  const engineerId = uuidv4();
  const securityId = uuidv4();
  const tenantUser1Id = uuidv4();
  const tenantUser2Id = uuidv4();
  
  if (existingUsers.length === 0) {
    db.insert('users', {
      id: engineerId,
      username: 'engineer_wang',
      role: 'engineer',
      name: '王工程师',
      tenant_id: null
    });
    
    db.insert('users', {
      id: securityId,
      username: 'security_liu',
      role: 'security',
      name: '刘安保',
      tenant_id: null
    });
    
    db.insert('users', {
      id: tenantUser1Id,
      username: 'tenant_zhang',
      role: 'tenant',
      name: '张经理',
      tenant_id: tenant1Id
    });
    
    db.insert('users', {
      id: tenantUser2Id,
      username: 'tenant_li',
      role: 'tenant',
      name: '李主管',
      tenant_id: tenant2Id
    });
  }

  const existingApps = db.findAll('renovation_applications');
  const app1Id = uuidv4();
  const app2Id = uuidv4();
  
  if (existingApps.length === 0) {
    db.insert('renovation_applications', {
      id: app1Id,
      tenant_id: tenant1Id,
      title: '办公室装修改造',
      description: '对A座1501室进行内部装修改造',
      status: 'draft',
      has_noise_work: 1,
      noise_time_slots: JSON.stringify([{ start: '09:00', end: '11:00' }]),
      created_at: new Date().toISOString(),
      submitted_at: null,
      reviewed_at: null,
      permit_issued_at: null
    });
    
    db.insert('renovation_applications', {
      id: app2Id,
      tenant_id: tenant2Id,
      title: '会议室翻新',
      description: 'B座805室会议室墙面翻新',
      status: 'submitted',
      has_noise_work: 0,
      noise_time_slots: null,
      created_at: new Date().toISOString(),
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
      permit_issued_at: null
    });

    const drawing1Id = uuidv4();
    db.insert('drawings', {
      id: drawing1Id,
      application_id: app2Id,
      type: 'floor_plan',
      file_name: '平面图.jpg',
      file_path: 'sample_floor_plan.jpg',
      uploaded_at: new Date().toISOString()
    });
  }

  console.log('样例数据初始化完成！');
  console.log('租户用户: tenant_zhang (星辰科技), tenant_li (云端网络)');
  console.log('工程师用户: engineer_wang');
  console.log('安保用户: security_liu');
  
  const tenants = db.findAll('tenants');
  const engineer = db.findOne('users', function(u) { return u.role === 'engineer'; });
  const security = db.findOne('users', function(u) { return u.role === 'security'; });
  const apps = db.findAll('renovation_applications');
  
  var result = {};
  if (tenants.length > 0) result.tenant1Id = tenants[0].id;
  if (tenants.length > 1) result.tenant2Id = tenants[1].id;
  if (engineer) result.engineerId = engineer.id;
  if (security) result.securityId = security.id;
  if (apps.length > 0) result.app1Id = apps[0].id;
  if (apps.length > 1) result.app2Id = apps[1].id;
  
  return result;
}

if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;

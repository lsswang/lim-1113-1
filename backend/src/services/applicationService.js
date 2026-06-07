const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { validateNoiseTimeSlots, checkFireSafetyDrawing, canModifyDrawings, canReview } = require('./validationService');

function getNowIso() {
  return new Date().toISOString();
}

function createApplication(tenantId, data) {
  const id = uuidv4();
  const now = getNowIso();
  
  const application = {
    id,
    tenant_id: tenantId,
    title: data.title,
    description: data.description || '',
    status: 'draft',
    has_noise_work: 0,
    noise_time_slots: null,
    created_at: now,
    submitted_at: null,
    reviewed_at: null,
    permit_issued_at: null
  };
  
  db.insert('renovation_applications', application);
  return getApplicationById(id);
}

function getApplicationById(id) {
  const application = db.findOne('renovation_applications', a => a.id === id);
  
  if (!application) return null;
  
  const drawings = db.findAll('drawings', d => d.application_id === id);
  
  const reviews = db.findAll('reviews', r => r.application_id === id).map(review => {
    const reviewer = db.findOne('users', u => u.id === review.reviewer_id);
    return {
      ...review,
      reviewer_name: reviewer ? reviewer.name : '未知用户'
    };
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
  const permit = db.findOne('work_permits', wp => wp.application_id === id);
  let permitWithIssuer = null;
  if (permit) {
    const issuer = db.findOne('users', u => u.id === permit.issued_by);
    permitWithIssuer = {
      ...permit,
      issuer_name: issuer ? issuer.name : '未知用户',
      allowed_time_slots: permit.allowed_time_slots ? JSON.parse(permit.allowed_time_slots) : null
    };
  }
  
  return {
    ...application,
    noise_time_slots: application.noise_time_slots ? JSON.parse(application.noise_time_slots) : null,
    drawings,
    reviews,
    permit: permitWithIssuer
  };
}

function getApplicationsByTenant(tenantId) {
  return db.findAll('renovation_applications', a => a.tenant_id === tenantId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(app => ({
      ...app,
      noise_time_slots: app.noise_time_slots ? JSON.parse(app.noise_time_slots) : null
    }));
}

function getAllApplications() {
  return db.findAll('renovation_applications')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(app => {
      const tenant = db.findOne('tenants', t => t.id === app.tenant_id);
      return {
        ...app,
        tenant_name: tenant ? tenant.name : null,
        room_number: tenant ? tenant.room_number : null,
        noise_time_slots: app.noise_time_slots ? JSON.parse(app.noise_time_slots) : null
      };
    });
}

function submitApplication(id, data) {
  const application = db.findOne('renovation_applications', a => a.id === id);
  
  if (!application) {
    throw new Error('申请不存在');
  }
  
  if (application.status !== 'draft') {
    throw new Error('只有草稿状态的申请可以提交');
  }
  
  const noiseValidation = validateNoiseTimeSlots(data.noise_time_slots);
  if (!noiseValidation.valid) {
    throw new Error(noiseValidation.message);
  }
  
  db.update('renovation_applications', 
    a => a.id === id,
    {
      status: 'submitted',
      submitted_at: getNowIso(),
      has_noise_work: data.has_noise_work ? 1 : 0,
      noise_time_slots: data.noise_time_slots ? JSON.stringify(data.noise_time_slots) : null
    }
  );
  
  return getApplicationById(id);
}

function reviewApplication(id, reviewerId, reviewData) {
  const reviewCheck = canReview(id);
  if (!reviewCheck.canReview) {
    throw new Error(reviewCheck.message);
  }
  
  if (reviewData.status === 'approved') {
    const fireCheck = checkFireSafetyDrawing(id);
    if (!fireCheck.hasFireSafety) {
      throw new Error(fireCheck.message);
    }
  }
  
  const reviewId = uuidv4();
  db.insert('reviews', {
    id: reviewId,
    application_id: id,
    reviewer_id: reviewerId,
    status: reviewData.status,
    comments: reviewData.comments || '',
    created_at: getNowIso()
  });
  
  const newStatus = reviewData.status === 'approved' ? 'permit_pending' : 'rejected';
  
  db.update('renovation_applications',
    a => a.id === id,
    {
      status: newStatus,
      reviewed_at: getNowIso()
    }
  );
  
  return getApplicationById(id);
}

function issuePermit(id, issuedBy, permitData) {
  const application = db.findOne('renovation_applications', a => a.id === id);
  
  if (!application) {
    throw new Error('申请不存在');
  }
  
  if (application.status !== 'permit_pending' && application.status !== 'approved') {
    throw new Error('当前状态不可核发施工证');
  }
  
  const permitId = uuidv4();
  db.insert('work_permits', {
    id: permitId,
    application_id: id,
    issued_by: issuedBy,
    valid_from: permitData.valid_from,
    valid_to: permitData.valid_to,
    allowed_time_slots: permitData.allowed_time_slots ? JSON.stringify(permitData.allowed_time_slots) : null,
    created_at: getNowIso()
  });
  
  db.update('renovation_applications',
    a => a.id === id,
    {
      status: 'permit_issued',
      permit_issued_at: getNowIso()
    }
  );
  
  return getApplicationById(id);
}

function addDrawing(applicationId, drawingData) {
  const modifyCheck = canModifyDrawings(applicationId);
  if (!modifyCheck.canModify) {
    throw new Error(modifyCheck.message);
  }
  
  const id = uuidv4();
  const drawing = {
    id,
    application_id: applicationId,
    type: drawingData.type,
    file_name: drawingData.file_name,
    file_path: drawingData.file_path,
    uploaded_at: getNowIso()
  };
  
  db.insert('drawings', drawing);
  return db.findOne('drawings', d => d.id === id);
}

function deleteDrawing(drawingId) {
  const drawing = db.findOne('drawings', d => d.id === drawingId);
  if (!drawing) {
    throw new Error('图纸不存在');
  }
  
  const modifyCheck = canModifyDrawings(drawing.application_id);
  if (!modifyCheck.canModify) {
    throw new Error(modifyCheck.message);
  }
  
  db.remove('drawings', d => d.id === drawingId);
  return { success: true };
}

module.exports = {
  createApplication,
  getApplicationById,
  getApplicationsByTenant,
  getAllApplications,
  submitApplication,
  reviewApplication,
  issuePermit,
  addDrawing,
  deleteDrawing
};

const { ALLOWED_NOISE_SLOTS } = require('../config');
const db = require('../db');

function isTimeInAllowedSlots(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  return ALLOWED_NOISE_SLOTS.some(slot => {
    const [startH, startM] = slot.start.split(':').map(Number);
    const [endH, endM] = slot.end.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    return totalMinutes >= startTotal && totalMinutes <= endTotal;
  });
}

function validateNoiseTimeSlots(timeSlots) {
  if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
    return { valid: true };
  }

  for (const slot of timeSlots) {
    if (!slot.start || !slot.end) {
      return { valid: false, message: '噪声时段必须包含开始和结束时间' };
    }
    if (!isTimeInAllowedSlots(slot.start)) {
      return { 
        valid: false, 
        message: `噪声作业开始时间 ${slot.start} 不在允许时段内（允许时段：${ALLOWED_NOISE_SLOTS.map(s => `${s.start}-${s.end}`).join('、')}）` 
      };
    }
    if (!isTimeInAllowedSlots(slot.end)) {
      return { 
        valid: false, 
        message: `噪声作业结束时间 ${slot.end} 不在允许时段内（允许时段：${ALLOWED_NOISE_SLOTS.map(s => `${s.start}-${s.end}`).join('、')}）` 
      };
    }
  }
  return { valid: true };
}

function checkFireSafetyDrawing(applicationId) {
  const fireSafetyDrawing = db.findOne('drawings', 
    d => d.application_id === applicationId && d.type === 'fire_safety'
  );
  
  return {
    hasFireSafety: !!fireSafetyDrawing,
    message: fireSafetyDrawing ? null : '缺少消防图纸，无法通过会审'
  };
}

function canModifyDrawings(applicationId) {
  const application = db.findOne('renovation_applications', 
    a => a.id === applicationId
  );
  
  if (!application) {
    return { canModify: false, message: '申请不存在' };
  }
  
  if (application.status === 'permit_issued') {
    return { canModify: false, message: '施工证已核发，图纸不可替换' };
  }
  
  return { canModify: true };
}

function canReview(applicationId) {
  const application = db.findOne('renovation_applications', 
    a => a.id === applicationId
  );
  
  if (!application) {
    return { canReview: false, message: '申请不存在' };
  }
  
  if (application.status !== 'submitted') {
    return { canReview: false, message: `当前状态为 ${application.status}，不可进行会审` };
  }
  
  return { canReview: true };
}

module.exports = {
  validateNoiseTimeSlots,
  checkFireSafetyDrawing,
  canModifyDrawings,
  canReview,
  isTimeInAllowedSlots
};

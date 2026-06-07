import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getApplication, 
  submitApplication, 
  reviewApplication, 
  issuePermit,
  uploadDrawing,
  deleteDrawing
} from '../api.js';

export default function ApplicationDetail({ role, currentUser, statusMap, drawingTypeLabels, allowedNoiseSlots }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [hasNoiseWork, setHasNoiseWork] = useState(false);
  const [noiseTimeSlots, setNoiseTimeSlots] = useState([]);
  
  const [uploadType, setUploadType] = useState('floor_plan');
  const fileInputRef = useRef(null);
  
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewComments, setReviewComments] = useState('');
  
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  useEffect(() => {
    loadApplication();
  }, [id]);

  async function loadApplication() {
    try {
      setLoading(true);
      const data = await getApplication(id);
      setApplication(data);
      setHasNoiseWork(!!data.has_noise_work);
      setNoiseTimeSlots(data.noise_time_slots || []);
    } catch (err) {
      setError('加载申请详情失败');
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function handleSubmit() {
    clearMessages();
    try {
      const data = await submitApplication(id, {
        has_noise_work: hasNoiseWork,
        noise_time_slots: noiseTimeSlots
      });
      setApplication(data);
      setSuccess('申请已提交，等待工程师会审');
    } catch (err) {
      setError(err.response?.data?.error || '提交失败');
    }
  }

  async function handleReview() {
    clearMessages();
    try {
      const data = await reviewApplication(id, {
        reviewer_id: currentUser.id,
        status: reviewStatus,
        comments: reviewComments
      });
      setApplication(data);
      setSuccess(reviewStatus === 'approved' ? '会审通过，待安保核发施工证' : '已驳回申请');
    } catch (err) {
      setError(err.response?.data?.error || '会审操作失败');
    }
  }

  async function handleIssuePermit() {
    clearMessages();
    if (!validFrom || !validTo) {
      setError('请填写施工证有效期');
      return;
    }
    try {
      const data = await issuePermit(id, {
        issued_by: currentUser.id,
        valid_from: validFrom,
        valid_to: validTo,
        allowed_time_slots: noiseTimeSlots
      });
      setApplication(data);
      setSuccess('施工证已核发');
    } catch (err) {
      setError(err.response?.data?.error || '核发失败');
    }
  }

  async function handleFileUpload(e) {
    clearMessages();
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await uploadDrawing(id, file, uploadType);
      await loadApplication();
      setSuccess('图纸上传成功');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || '上传失败');
    }
  }

  async function handleDeleteDrawing(drawingId) {
    if (!confirm('确定要删除这张图纸吗？')) return;
    clearMessages();
    try {
      await deleteDrawing(drawingId);
      await loadApplication();
      setSuccess('图纸已删除');
    } catch (err) {
      setError(err.response?.data?.error || '删除失败');
    }
  }

  function addNoiseSlot() {
    if (allowedNoiseSlots.length > 0) {
      setNoiseTimeSlots([...noiseTimeSlots, { ...allowedNoiseSlots[0] }]);
    }
  }

  function updateNoiseSlot(index, field, value) {
    const updated = [...noiseTimeSlots];
    updated[index] = { ...updated[index], [field]: value };
    setNoiseTimeSlots(updated);
  }

  function removeNoiseSlot(index) {
    setNoiseTimeSlots(noiseTimeSlots.filter((_, i) => i !== index));
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;
  }

  if (!application) {
    return <div className="alert alert-error">申请不存在</div>;
  }

  const hasFireSafety = application.drawings?.some(d => d.type === 'fire_safety');
  const canModifyDrawings = application.status !== 'permit_issued';

  return (
    <div>
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
        ← 返回列表
      </button>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h2>{application.title}</h2>
            <p style={{ color: '#718096', marginTop: '0.5rem' }}>
              {application.description || '暂无描述'}
            </p>
          </div>
          <span className={`status-badge status-${application.status}`}>
            {statusMap[application.status]}
          </span>
        </div>
        <div className="application-meta" style={{ marginTop: '1rem' }}>
          {application.tenant_name && <span>租户: {application.tenant_name}</span>}
          {application.room_number && <span>房间: {application.room_number}</span>}
          <span>创建时间: {new Date(application.created_at).toLocaleString('zh-CN')}</span>
        </div>
      </div>

      <div className="card">
        <h2>📐 装修图纸</h2>
        
        {!hasFireSafety && application.status !== 'draft' && (
          <div className="alert alert-warning">
            ⚠️ 尚未上传消防图纸，会审将无法通过
          </div>
        )}

        {canModifyDrawings && (
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '0 0 200px', marginBottom: 0 }}>
              <select 
                value={uploadType}
                onChange={e => setUploadType(e.target.value)}
              >
                {Object.entries(drawingTypeLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.dwg"
            />
            <button 
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              + 上传图纸
            </button>
          </div>
        )}

        {!canModifyDrawings && (
          <div className="alert alert-warning">
            🔒 施工证已核发，图纸不可替换
          </div>
        )}

        {application.drawings?.length === 0 ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>
            暂无上传的图纸
          </p>
        ) : (
          <div className="drawing-list">
            {application.drawings.map(drawing => (
              <div 
                key={drawing.id} 
                className={`drawing-item ${drawing.type === 'fire_safety' ? 'fire-safety' : ''}`}
              >
                <div className="drawing-type">
                  {drawing.type === 'fire_safety' && '🚒 '}
                  {drawingTypeLabels[drawing.type]}
                </div>
                <div className="drawing-name">{drawing.file_name}</div>
                {canModifyDrawings && (
                  <button 
                    className="btn btn-danger"
                    style={{ marginTop: '0.5rem', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                    onClick={() => handleDeleteDrawing(drawing.id)}
                  >
                    删除
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {role === 'tenant' && application.status === 'draft' && (
        <div className="card">
          <h2>📝 提交申请</h2>
          
          <div className="form-group checkbox-group">
            <input 
              type="checkbox"
              id="noiseWork"
              checked={hasNoiseWork}
              onChange={e => setHasNoiseWork(e.target.checked)}
            />
            <label htmlFor="noiseWork">包含噪声作业</label>
          </div>

          {hasNoiseWork && (
            <div className="form-group">
              <label>噪声作业时段（允许时段: {allowedNoiseSlots.map(s => `${s.start}-${s.end}`).join('、')}）</label>
              {noiseTimeSlots.map((slot, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input 
                    type="time"
                    value={slot.start}
                    onChange={e => updateNoiseSlot(index, 'start', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <span style={{ alignSelf: 'center' }}>至</span>
                  <input 
                    type="time"
                    value={slot.end}
                    onChange={e => updateNoiseSlot(index, 'end', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button"
                    className="btn btn-danger"
                    style={{ padding: '0.5rem 0.75rem' }}
                    onClick={() => removeNoiseSlot(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button 
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '0.5rem' }}
                onClick={addNoiseSlot}
              >
                + 添加时段
              </button>
            </div>
          )}

          <button 
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!hasFireSafety}
          >
            {!hasFireSafety ? '请先上传消防图' : '提交会审'}
          </button>
        </div>
      )}

      {role === 'engineer' && application.status === 'submitted' && (
        <div className="card">
          <h2>🔍 工程师会审</h2>
          
          {!hasFireSafety && (
            <div className="alert alert-error">
              ❌ 缺少消防图纸，此申请不能通过会审
            </div>
          )}

          <div className="form-group">
            <label>会审结果</label>
            <select 
              value={reviewStatus}
              onChange={e => setReviewStatus(e.target.value)}
            >
              <option value="approved">通过</option>
              <option value="rejected">驳回</option>
            </select>
          </div>

          <div className="form-group">
            <label>会审意见</label>
            <textarea 
              rows="3"
              value={reviewComments}
              onChange={e => setReviewComments(e.target.value)}
              placeholder="请输入会审意见..."
            />
          </div>

          <div className="button-group">
            <button 
              className="btn btn-success"
              onClick={handleReview}
              disabled={reviewStatus === 'approved' && !hasFireSafety}
            >
              {reviewStatus === 'approved' ? '通过会审' : '驳回申请'}
            </button>
          </div>
        </div>
      )}

      {role === 'security' && (application.status === 'permit_pending' || application.status === 'approved') && (
        <div className="card">
          <h2>🎫 核发施工证</h2>
          
          <div className="row">
            <div className="form-group">
              <label>有效期开始</label>
              <input 
                type="date"
                value={validFrom}
                onChange={e => setValidFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>有效期结束</label>
              <input 
                type="date"
                value={validTo}
                onChange={e => setValidTo(e.target.value)}
              />
            </div>
          </div>

          {application.has_noise_work && application.noise_time_slots && (
            <div className="form-group">
              <label>允许噪声作业时段</label>
              <div className="time-slots">
                {application.noise_time_slots.map((slot, i) => (
                  <span key={i} className="time-slot">{slot.start} - {slot.end}</span>
                ))}
              </div>
            </div>
          )}

          <button 
            className="btn btn-success"
            onClick={handleIssuePermit}
          >
            核发施工证
          </button>
        </div>
      )}

      {application.permit && (
        <div className="card permit-info">
          <h3>🎫 施工许可证</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <strong>核发人:</strong> {application.permit.issuer_name}
            </div>
            <div>
              <strong>有效期:</strong> {application.permit.valid_from} 至 {application.permit.valid_to}
            </div>
            <div>
              <strong>核发时间:</strong> {new Date(application.permit.created_at).toLocaleString('zh-CN')}
            </div>
          </div>
          {application.permit.allowed_time_slots && application.permit.allowed_time_slots.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <strong>允许施工时段:</strong>
              <div className="time-slots" style={{ marginTop: '0.5rem' }}>
                {application.permit.allowed_time_slots.map((slot, i) => (
                  <span key={i} className="time-slot">{slot.start} - {slot.end}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {application.reviews && application.reviews.length > 0 && (
        <div className="card">
          <h2>📋 会审记录</h2>
          {application.reviews.map(review => (
            <div key={review.id} className="review-item">
              <div className="reviewer">
                {review.reviewer_name} 
                <span className={`status-badge status-${review.status}`} style={{ marginLeft: '0.5rem' }}>
                  {review.status === 'approved' ? '通过' : '驳回'}
                </span>
              </div>
              <div className="review-time">{new Date(review.created_at).toLocaleString('zh-CN')}</div>
              {review.comments && <p style={{ color: '#4a5568' }}>{review.comments}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

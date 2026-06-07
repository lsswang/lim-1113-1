import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplications, createApplication } from '../api.js';

export default function TenantDashboard({ tenant, statusMap, drawingTypeLabels, allowedNoiseSlots }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, [tenant]);

  async function loadApplications() {
    try {
      const data = await getApplications(tenant.id);
      setApplications(data);
    } catch (err) {
      setError('加载申请列表失败');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const app = await createApplication({
        tenant_id: tenant.id,
        title: newTitle,
        description: newDescription
      });
      setShowCreateForm(false);
      setNewTitle('');
      setNewDescription('');
      navigate(`/application/${app.id}`);
    } catch (err) {
      setError(err.response?.data?.error || '创建申请失败');
    }
  }

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>👤 {tenant.name}</h2>
            <p style={{ color: '#718096', marginTop: '0.5rem' }}>
              房间号: {tenant.room_number} | 联系人: {tenant.contact_person}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            + 新建装修申请
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {showCreateForm && (
        <div className="card">
          <h2>新建装修申请</h2>
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label>申请标题 *</label>
              <input 
                type="text" 
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="例如：办公室装修改造"
                required
              />
            </div>
            <div className="form-group">
              <label>项目描述</label>
              <textarea 
                rows="3"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="简要描述装修内容"
              />
            </div>
            <div className="button-group">
              <button type="submit" className="btn btn-primary">创建申请</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowCreateForm(false)}>
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h2>📋 我的装修申请</h2>
        {applications.length === 0 ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>
            暂无装修申请，点击上方按钮创建第一个申请
          </p>
        ) : (
          <div className="application-list">
            {applications.map(app => (
              <div 
                key={app.id} 
                className="application-item"
                onClick={() => navigate(`/application/${app.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <h3>{app.title}</h3>
                  <span className={`status-badge status-${app.status}`}>
                    {statusMap[app.status]}
                  </span>
                </div>
                {app.description && (
                  <p style={{ color: '#718096', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                    {app.description}
                  </p>
                )}
                <div className="application-meta" style={{ marginTop: '0.75rem' }}>
                  <span>创建时间: {new Date(app.created_at).toLocaleString('zh-CN')}</span>
                  {app.submitted_at && <span>提交时间: {new Date(app.submitted_at).toLocaleString('zh-CN')}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

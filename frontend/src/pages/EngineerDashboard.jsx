import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApplications } from '../api.js';

export default function EngineerDashboard({ currentUser, statusMap, drawingTypeLabels }) {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [error, setError] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      setError('加载申请列表失败');
    }
  }

  const pendingApps = applications.filter(a => a.status === 'submitted');
  const reviewedApps = applications.filter(a => ['rejected', 'approved', 'permit_pending', 'permit_issued'].includes(a.status));

  const displayApps = activeTab === 'pending' ? pendingApps : reviewedApps;

  return (
    <div>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2>👨‍🔧 工程师工作台</h2>
            <p style={{ color: '#718096', marginTop: '0.5rem' }}>
              当前用户: {currentUser.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span className="status-badge status-submitted">待会审: {pendingApps.length}</span>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            待会审 ({pendingApps.length})
          </div>
          <div 
            className={`tab ${activeTab === 'reviewed' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviewed')}
          >
            已处理
          </div>
        </div>

        {displayApps.length === 0 ? (
          <p style={{ color: '#718096', textAlign: 'center', padding: '2rem' }}>
            {activeTab === 'pending' ? '暂无待会审的申请' : '暂无已处理的申请'}
          </p>
        ) : (
          <div className="application-list">
            {displayApps.map(app => (
              <div 
                key={app.id} 
                className="application-item"
                onClick={() => navigate(`/application/${app.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3>{app.title}</h3>
                    <p style={{ color: '#718096', fontSize: '0.9rem' }}>
                      {app.tenant_name} - {app.room_number}
                    </p>
                  </div>
                  <span className={`status-badge status-${app.status}`}>
                    {statusMap[app.status]}
                  </span>
                </div>
                {app.description && (
                  <p style={{ color: '#718096', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    {app.description}
                  </p>
                )}
                <div className="application-meta" style={{ marginTop: '0.75rem' }}>
                  <span>提交时间: {app.submitted_at ? new Date(app.submitted_at).toLocaleString('zh-CN') : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

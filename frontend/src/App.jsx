import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TenantDashboard from './pages/TenantDashboard.jsx';
import EngineerDashboard from './pages/EngineerDashboard.jsx';
import SecurityDashboard from './pages/SecurityDashboard.jsx';
import ApplicationDetail from './pages/ApplicationDetail.jsx';
import { getConfig, getTenants, getUsers } from './api.js';

export default function App() {
  const [currentRole, setCurrentRole] = useState('tenant');
  const [config, setConfig] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [securityUsers, setSecurityUsers] = useState([]);
  const [currentTenant, setCurrentTenant] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (tenants.length > 0 && !currentTenant) {
      setCurrentTenant(tenants[0]);
    }
  }, [tenants]);

  useEffect(() => {
    if (currentRole === 'engineer' && engineers.length > 0) {
      setCurrentUser(engineers[0]);
    } else if (currentRole === 'security' && securityUsers.length > 0) {
      setCurrentUser(securityUsers[0]);
    } else if (currentRole === 'tenant' && tenants.length > 0) {
      const tenantUser = { id: tenants[0].id, name: tenants[0].contact_person, role: 'tenant' };
      setCurrentUser(tenantUser);
    }
  }, [currentRole, engineers, securityUsers, tenants]);

  async function loadInitialData() {
    try {
      const [cfg, tenantList, engList, secList] = await Promise.all([
        getConfig(),
        getTenants(),
        getUsers('engineer'),
        getUsers('security')
      ]);
      setConfig(cfg);
      setTenants(tenantList);
      setEngineers(engList);
      setSecurityUsers(secList);
    } catch (error) {
      console.error('加载初始数据失败:', error);
    }
  }

  if (!config) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>加载中...</div>;
  }

  const statusMap = config.status_map;
  const drawingTypeLabels = {
    floor_plan: '平面图',
    fire_safety: '消防图',
    electrical: '电气图',
    water: '给排水图',
    other: '其他'
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🏗️ 租户装修图纸会审系统</h1>
        <nav className="nav">
          <button 
            className={currentRole === 'tenant' ? 'active' : ''}
            onClick={() => setCurrentRole('tenant')}
          >
            租户端
          </button>
          <button 
            className={currentRole === 'engineer' ? 'active' : ''}
            onClick={() => setCurrentRole('engineer')}
          >
            工程师会审
          </button>
          <button 
            className={currentRole === 'security' ? 'active' : ''}
            onClick={() => setCurrentRole('security')}
          >
            安保核发
          </button>
        </nav>
      </header>

      <div className="container">
        {currentRole === 'tenant' && currentTenant && (
          <Routes>
            <Route path="/" element={
              <TenantDashboard 
                tenant={currentTenant}
                statusMap={statusMap}
                drawingTypeLabels={drawingTypeLabels}
                allowedNoiseSlots={config.allowed_noise_slots}
              />
            } />
            <Route path="/application/:id" element={
              <ApplicationDetail 
                role="tenant"
                currentUser={currentUser}
                statusMap={statusMap}
                drawingTypeLabels={drawingTypeLabels}
                allowedNoiseSlots={config.allowed_noise_slots}
              />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}

        {currentRole === 'engineer' && currentUser && (
          <Routes>
            <Route path="/" element={
              <EngineerDashboard 
                currentUser={currentUser}
                statusMap={statusMap}
                drawingTypeLabels={drawingTypeLabels}
              />
            } />
            <Route path="/application/:id" element={
              <ApplicationDetail 
                role="engineer"
                currentUser={currentUser}
                statusMap={statusMap}
                drawingTypeLabels={drawingTypeLabels}
                allowedNoiseSlots={config.allowed_noise_slots}
              />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}

        {currentRole === 'security' && currentUser && (
          <Routes>
            <Route path="/" element={
              <SecurityDashboard 
                currentUser={currentUser}
                statusMap={statusMap}
                drawingTypeLabels={drawingTypeLabels}
                allowedNoiseSlots={config.allowed_noise_slots}
              />
            } />
            <Route path="/application/:id" element={
              <ApplicationDetail 
                role="security"
                currentUser={currentUser}
                statusMap={statusMap}
                drawingTypeLabels={drawingTypeLabels}
                allowedNoiseSlots={config.allowed_noise_slots}
              />
            } />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </div>
    </div>
  );
}

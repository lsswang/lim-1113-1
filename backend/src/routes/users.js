const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  try {
    const { role } = req.query;
    let users = db.findAll('users');
    if (role) {
      users = users.filter(u => u.role === role);
    }
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const user = db.findOne('users', u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tenants/list', (req, res) => {
  try {
    const tenants = db.findAll('tenants')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    res.json(tenants);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;

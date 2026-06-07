module.exports = {
  ALLOWED_NOISE_SLOTS: [
    { start: '09:00', end: '12:00' },
    { start: '14:00', end: '18:00' }
  ],
  PORT: process.env.PORT || 3001,
  UPLOAD_DIR: 'uploads',
  DRAWING_TYPES: ['floor_plan', 'fire_safety', 'electrical', 'water', 'other']
};

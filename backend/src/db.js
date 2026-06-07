const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'database.json');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function loadData() {
  if (!fs.existsSync(dbPath)) {
    const initialData = {
      tenants: [],
      users: [],
      renovation_applications: [],
      drawings: [],
      reviews: [],
      work_permits: []
    };
    saveData(initialData);
    return initialData;
  }
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (e) {
    return {
      tenants: [],
      users: [],
      renovation_applications: [],
      drawings: [],
      reviews: [],
      work_permits: []
    };
  }
}

function saveData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

let dbData = loadData();

function getTable(tableName) {
  return dbData[tableName] || [];
}

function setTable(tableName, records) {
  dbData[tableName] = records;
  saveData(dbData);
}

function findAll(tableName, filterFn) {
  const records = getTable(tableName);
  if (filterFn) {
    return records.filter(filterFn);
  }
  return [...records];
}

function findOne(tableName, filterFn) {
  const records = getTable(tableName);
  return records.find(filterFn) || null;
}

function insert(tableName, record) {
  const records = getTable(tableName);
  records.push(record);
  setTable(tableName, records);
  return record;
}

function update(tableName, filterFn, updates) {
  const records = getTable(tableName);
  let updatedCount = 0;
  const updatedRecords = records.map(record => {
    if (filterFn(record)) {
      updatedCount++;
      return { ...record, ...updates };
    }
    return record;
  });
  setTable(tableName, updatedRecords);
  return updatedCount;
}

function remove(tableName, filterFn) {
  const records = getTable(tableName);
  const newRecords = records.filter(record => !filterFn(record));
  const removedCount = records.length - newRecords.length;
  setTable(tableName, newRecords);
  return removedCount;
}

function resetDatabase() {
  dbData = {
    tenants: [],
    users: [],
    renovation_applications: [],
    drawings: [],
    reviews: [],
    work_permits: []
  };
  saveData(dbData);
}

function prepare(query) {
  return {
    all(...params) {
      return [];
    },
    get(...params) {
      return null;
    },
    run(...params) {
      return { changes: 0 };
    }
  };
}

module.exports = {
  loadData,
  saveData,
  findAll,
  findOne,
  insert,
  update,
  remove,
  resetDatabase,
  prepare
};

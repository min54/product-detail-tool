const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data.json');

function readDB() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify({ projects: [], nextId: 1 }, null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

function listProjects() {
  const db = readDB();
  return db.projects.map(p => ({ id: p.id, name: p.name, created_at: p.created_at, updated_at: p.updated_at }));
}

function getProject(id) {
  const db = readDB();
  return db.projects.find(p => p.id === id) || null;
}

function createProject(name, data) {
  const db = readDB();
  const now = new Date().toISOString();
  const project = { id: db.nextId++, name, data, created_at: now, updated_at: now };
  db.projects.push(project);
  writeDB(db);
  return { id: project.id, name };
}

function updateProject(id, name, data) {
  const db = readDB();
  const project = db.projects.find(p => p.id === id);
  if (!project) return null;
  project.name = name;
  project.data = data;
  project.updated_at = new Date().toISOString();
  writeDB(db);
  return { id, name };
}

function deleteProject(id) {
  const db = readDB();
  db.projects = db.projects.filter(p => p.id !== id);
  writeDB(db);
}

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };

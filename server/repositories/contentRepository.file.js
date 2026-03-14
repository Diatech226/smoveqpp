const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'content.json');

const defaultState = {
  blogPosts: [],
  projects: [],
  mediaFiles: [],
  pageContent: null,
  settings: null,
};

function ensureStore() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify(defaultState, null, 2));
  }
}

function readState() {
  ensureStore();
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      blogPosts: Array.isArray(parsed.blogPosts) ? parsed.blogPosts : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      mediaFiles: Array.isArray(parsed.mediaFiles) ? parsed.mediaFiles : [],
      pageContent: parsed.pageContent && typeof parsed.pageContent === 'object' ? parsed.pageContent : null,
      settings: parsed.settings && typeof parsed.settings === 'object' ? parsed.settings : null,
    };
  } catch {
    return { ...defaultState };
  }
}

function writeState(state) {
  ensureStore();
  fs.writeFileSync(DATA_PATH, JSON.stringify(state, null, 2));
}

class FileContentRepository {
  getState() {
    return readState();
  }

  saveState(state) {
    writeState({
      ...defaultState,
      ...state,
      blogPosts: Array.isArray(state.blogPosts) ? state.blogPosts : [],
      projects: Array.isArray(state.projects) ? state.projects : [],
      mediaFiles: Array.isArray(state.mediaFiles) ? state.mediaFiles : [],
    });
  }

  getBlogPosts() {
    return readState().blogPosts;
  }

  saveBlogPosts(blogPosts) {
    const state = readState();
    state.blogPosts = blogPosts;
    writeState(state);
  }
}

module.exports = { FileContentRepository };

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'content.json');

const defaultState = {
  blogPosts: [],
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

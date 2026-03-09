function normalizeSlug(input = '', max = 180) {
  return input
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max);
}

function createValidator(parser) {
  return (payload) => {
    const errors = [];
    const value = parser(payload ?? {}, errors);
    return { value, errors };
  };
}

module.exports = { normalizeSlug, createValidator };

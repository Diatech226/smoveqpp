class HookBus {
  constructor() {
    this.handlers = new Map();
  }

  on(hook, handler) {
    const current = this.handlers.get(hook) ?? [];
    current.push(handler);
    this.handlers.set(hook, current);
  }

  async emit(hook, payload) {
    const handlers = this.handlers.get(hook) ?? [];
    let result = payload;
    for (const handler of handlers) {
      result = await handler(result);
    }
    return result;
  }
}

module.exports = { HookBus };

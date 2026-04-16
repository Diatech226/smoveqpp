class NewsletterService {
  constructor({ newsletterSubscriberRepository, userRepository = null }) {
    if (!newsletterSubscriberRepository) {
      throw new Error('NewsletterService requires newsletterSubscriberRepository.');
    }

    this.newsletterSubscriberRepository = newsletterSubscriberRepository;
    this.userRepository = userRepository;
  }

  async subscribe(payload) {
    const now = new Date();
    const existing = await this.newsletterSubscriberRepository.findByEmail(payload.email);
    const linkedUser = this.userRepository ? await this.userRepository.findByEmail(payload.email) : null;

    if (existing?.status === 'active') {
      return {
        action: 'already_active',
        subscriber: existing,
      };
    }

    const subscriber = await this.newsletterSubscriberRepository.upsertSubscription({
      email: payload.email,
      status: 'active',
      subscribedAt: existing?.subscribedAt ?? now,
      unsubscribedAt: null,
      source: payload.source,
      linkedUserId: linkedUser?.id ?? existing?.linkedUserId ?? null,
      meta: {
        ...(existing?.meta ?? {}),
        lastSource: payload.source,
      },
    });

    return {
      action: existing ? 'reactivated' : 'created',
      subscriber,
    };
  }

  async listSubscribers(filters) {
    const result = await this.newsletterSubscriberRepository.list(filters);
    return {
      ...result,
      items: await Promise.all(
        result.items.map(async (item) => {
          const linkedUser = item.linkedUserId && this.userRepository
            ? await this.userRepository.findById(item.linkedUserId)
            : (this.userRepository ? await this.userRepository.findByEmail(item.email) : null);

          return {
            ...item,
            linkedUser: linkedUser
              ? { id: linkedUser.id, email: linkedUser.email, name: linkedUser.name, role: linkedUser.role }
              : null,
          };
        }),
      ),
    };
  }

  async updateSubscriberStatus(id, { status, source = 'cms' }) {
    const existing = await this.newsletterSubscriberRepository.findById(id);
    if (!existing) {
      return { ok: false, error: { code: 'NEWSLETTER_NOT_FOUND', message: 'Subscriber not found.' }, status: 404 };
    }

    const linkedUser = this.userRepository ? await this.userRepository.findByEmail(existing.email) : null;
    const subscriber = await this.newsletterSubscriberRepository.updateStatus(id, {
      status,
      source,
      linkedUserId: linkedUser?.id ?? existing.linkedUserId ?? null,
      unsubscribedAt: status === 'unsubscribed' ? new Date() : null,
    });

    return { ok: true, subscriber };
  }
}

module.exports = { NewsletterService };

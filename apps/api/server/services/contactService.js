class ContactService {
  constructor({ contactSubmissionRepository, emailService }) {
    if (!contactSubmissionRepository) {
      throw new Error('ContactService requires a contactSubmissionRepository.');
    }
    this.contactSubmissionRepository = contactSubmissionRepository;
    this.emailService = emailService;
  }

  async submit(payload, context = {}) {
    const source = context.source ?? 'website';
    const requestId = context.requestId ?? null;

    const emailResult = this.emailService
      ? await this.emailService.sendContactEmail({ ...payload, source })
      : { delivered: false, mode: 'disabled' };

    const submission = await this.contactSubmissionRepository.create({
      ...payload,
      source,
      requestId,
      delivered: Boolean(emailResult?.delivered),
      deliveryMode: emailResult?.mode ?? null,
    });

    return {
      submission,
      delivered: Boolean(emailResult?.delivered),
      mode: emailResult?.mode ?? 'disabled',
    };
  }
}

module.exports = { ContactService };

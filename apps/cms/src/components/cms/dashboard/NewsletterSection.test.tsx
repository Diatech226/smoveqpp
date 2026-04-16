import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { NewsletterSection } from './NewsletterSection';

describe('NewsletterSection', () => {
  it('renders empty/loading/error states', () => {
    const html = renderToStaticMarkup(
      <NewsletterSection
        canManage
        loading
        error="Erreur API"
        notice=""
        subscribers={[]}
        search=""
        setSearch={() => {}}
        statusFilter="all"
        setStatusFilter={() => {}}
        sourceFilter="all"
        setSourceFilter={() => {}}
        refresh={() => {}}
        updateStatus={async () => {}}
      />, 
    );

    expect(html).toContain('Erreur API');
    expect(html).toContain('Chargement des abonnés');
  });

  it('renders subscriber rows and actions', () => {
    const html = renderToStaticMarkup(
      <NewsletterSection
        canManage
        loading={false}
        error=""
        notice="OK"
        subscribers={[
          {
            id: 'sub_1',
            email: 'john@example.com',
            status: 'active',
            source: 'footer',
            subscribedAt: '2026-01-02T00:00:00.000Z',
            linkedUser: { id: 'u1', email: 'john@example.com', name: 'John', role: 'client' },
            createdAt: '2026-01-02T00:00:00.000Z',
            updatedAt: '2026-01-02T00:00:00.000Z',
          },
        ]}
        search=""
        setSearch={() => {}}
        statusFilter="all"
        setStatusFilter={() => {}}
        sourceFilter="all"
        setSourceFilter={() => {}}
        refresh={() => {}}
        updateStatus={async () => {}}
      />, 
    );

    expect(html).toContain('john@example.com');
    expect(html).toContain('Désabonner');
  });
});

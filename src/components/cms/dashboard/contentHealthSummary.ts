import type { ContentHealthSummary } from '../../../utils/contentApi';

export interface DashboardReadinessSnapshot {
  blockerCount: number;
  warningCount: number;
  publishReadyCount: number;
  publishedCount: number;
  unresolvedRouteCount: number;
  unresolvedMediaCount: number;
}

export const deriveDashboardReadinessSnapshot = (health: ContentHealthSummary): DashboardReadinessSnapshot => {
  const summary = health.launchReadiness.summary;
  const fallbackBlockers = health.launchReadiness.blockers.length;

  return {
    blockerCount: summary?.blockerCount ?? fallbackBlockers,
    warningCount: summary?.warningCount ?? 0,
    publishReadyCount: summary?.publishReadyCount ?? 0,
    publishedCount: summary?.publishedCount ??
      (health.publication.blog.published || 0) +
      (health.publication.projects.published || 0) +
      (health.publication.services.published || 0),
    unresolvedRouteCount: (health.quality.invalidServiceRoutes || 0) + (health.quality.routeCollisions || 0),
    unresolvedMediaCount: (health.quality.unresolvedMediaReferences || 0) +
      health.quality.missingPublishedMedia.blog +
      health.quality.missingPublishedMedia.projects +
      health.quality.missingPublishedMedia.services,
  };
};

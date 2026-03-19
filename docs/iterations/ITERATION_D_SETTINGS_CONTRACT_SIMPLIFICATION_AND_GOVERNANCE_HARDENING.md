# Iteration D — Settings Contract Simplification & Governance Hardening

Date: 2026-03-19

## Scope implemented

- Promoted nested settings as canonical contract for CMS/backend/public runtime:
  - `siteSettings.*`
  - `operationalSettings.*`
  - `taxonomySettings.*`
- Kept flat aliases as compatibility output only (`siteTitle`, `supportEmail`, `instantPublishing`, `taxonomy`).
- Hardened normalization across backend + frontend adapters so legacy flat payloads are safely repaired.
- Migrated public runtime consumers to read canonical nested settings.
- Preserved settings history + rollback behavior while ensuring restored snapshots normalize to canonical nested structure.

## Canonical settings shape

```ts
{
  siteSettings: {
    siteTitle: string;
    supportEmail: string;
    brandMedia: {
      logo: string;
      logoDark: string;
      favicon: string;
      defaultSocialImage: string;
    };
  };
  operationalSettings: {
    instantPublishing: boolean;
  };
  taxonomySettings: {
    blog: {
      managedCategories: string[];
      managedTags: string[];
      enforceManagedTags: boolean;
    };
  };
}
```

## Compatibility strategy

- Read path: accept nested or legacy flat fields.
- Normalize path: always repair into canonical nested object.
- Persist path: store normalized canonical object.
- Export path: include flat aliases for older consumers/snapshots until deprecation window is completed.

## Consumer migrations in this iteration

- CMS settings editor/save path now operates on canonical nested shape.
- Public runtime metadata and branding consumers now read nested contract:
  - document title
  - support email
  - logo
  - favicon
  - default social image

## Rollback/history safety

- Rollback still restores historical snapshots.
- Historical snapshots are normalized before write-back, preserving canonical nested settings and compatibility aliases.

## Remaining risks / follow-ups

- Flat aliases still exist for compatibility and should be removed in a future controlled deprecation iteration after consumer audit confirms zero dependency.
- CMS dashboard settings section remains inside a large file; further decomposition remains advisable for long-term maintainability.

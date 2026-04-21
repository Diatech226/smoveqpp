# HERO_FIRST_LOAD_AND_PUBLIC_SITE_UNIFICATION

## Summary
This change fixes a public-site initialization race that left Hero slides inactive on first load, restores reliable autoplay, and enforces a single canonical homepage render path.

## Root causes
1. **Homepage hydration was blocked by unrelated requests**.
   - `HomePageContent` waited for `Promise.allSettled([page-content, services, media, blog])` before applying homepage content.
   - When blog/media endpoints were slow or blocked, Hero never received authoritative homepage content on first load.
2. **Autoplay depended on fragile interaction timing and legacy flag shape**.
   - Autoplay paused on hero hover, which could keep rotation stopped while the pointer remained inside the hero.
   - Some payloads can have multiple slides with autoplay intent but inconsistent `heroBackgroundRotationEnabled` history.
3. **Homepage rendering existed in duplicate branches**.
   - `AppPageRenderer` rendered home via duplicated JSX in both `case 'home'` and `default`, increasing risk of branch drift.

## Fixes implemented

### 1) First-load Hero hydration fix
- Split homepage hydration into independent async flows:
  - page-content fetch updates Hero state immediately;
  - media fetch updates repository and increments a media revision to remount/re-hydrate Hero assets;
  - services/blog no longer block Hero initialization.
- Result: Hero uses authoritative public content on first load, without requiring CMS navigation.

### 2) Autoplay reliability fix
- Autoplay now:
  - starts whenever multiple slides are present and autoplay is enabled,
  - pauses only for explicit interaction focus and page visibility (hidden tab),
  - no longer pauses via broad hero hover.
- Interval lifecycle remains effect-driven with proper cleanup.

### 3) Canonical homepage render path unification
- `AppPageRenderer` now uses a single `renderHomePage()` helper for both explicit home route and fallback route.
- Reduces duplicate branch logic and keeps one canonical homepage renderer active.

## CMS-independent behavior
- Public homepage no longer relies on CMS-side local storage priming to show Hero slides.
- Authoritative public endpoints are consumed directly and immediately.

## Tests updated
- Added a behavior test to assert Hero hydration does **not** wait for the blog request.
- Added autoplay runtime test for Hero slide auto-advance.
- Added canonical route normalization test for `#/home -> #/`.

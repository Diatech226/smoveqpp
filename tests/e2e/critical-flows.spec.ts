import { expect, test } from '@playwright/test';

const adminEmail = 'admin@smove.test';
const adminPassword = 'AdminPass123!';

async function gotoHash(page, hash: string) {
  await page.goto(`/${hash.startsWith('#') ? hash : `#${hash}`}`);
}

async function registerClient(page, email: string) {
  await gotoHash(page, '#register');
  await page.locator('input[type="text"]').first().fill('Client QA');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill('ClientPass123!');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/#account/);
}

async function loginAs(page, email: string, password: string) {
  await gotoHash(page, '#login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').click();
}

test('register + client forbidden from CMS route', async ({ page }) => {
  const email = `client-${Date.now()}@smove.test`;
  await registerClient(page, email);

  await gotoHash(page, '#cms-dashboard');
  await expect(page.getByText('Accès refusé')).toBeVisible();
});

test('admin can login, manage blog lifecycle, edit page content, and access media selection', async ({ page }) => {
  await loginAs(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/#cms-dashboard/);

  await page.getByRole('button', { name: 'Blog' }).click();
  await page.getByRole('button', { name: 'Créer un article' }).click();

  const postTitle = `Post critical ${Date.now()}`;
  await page.locator('input').nth(0).fill(postTitle);
  await page.locator('input').nth(1).fill(`post-critical-${Date.now()}`);
  await page.locator('input').nth(2).fill('Admin QA');
  await page.locator('input').nth(3).fill('Ops');
  await page.locator('input').nth(4).fill('5 min');
  await page.locator('textarea').nth(0).fill('Résumé e2e production readiness.');
  await page.locator('textarea').nth(1).fill('Contenu e2e pour vérifier save et publication.');
  await page.locator('button', { hasText: 'Enregistrer' }).first().click();
  await expect(page.getByText('Article enregistré via backend CMS.')).toBeVisible();

  await page.getByRole('button', { name: 'Publier' }).first().click();
  await expect(page.getByText('Article mis à jour via backend CMS.')).toBeVisible();

  await page.getByRole('button', { name: 'Contenus pages' }).click();
  const updatedLine = `Hero line e2e ${Date.now()}`;
  await page.getByLabel('heroTitleLine1').fill(updatedLine);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('Contenu de page enregistré via backend CMS.')).toBeVisible();

  await page.getByRole('button', { name: 'Médiathèque' }).click();
  await expect(page.getByPlaceholder('Rechercher un média (nom, alt, tag)…')).toBeVisible();
});

test('admin logout returns to login', async ({ page }) => {
  await loginAs(page, adminEmail, adminPassword);
  await expect(page).toHaveURL(/#cms-dashboard/);
  await page.getByRole('button', { name: 'Déconnexion' }).click();
  await expect(page).toHaveURL(/#login/);
});

import { test, expect } from '@playwright/test';

test('registro de usuario', async ({ page }) => {
  const suffix = Date.now();
  const username = `e2e_user_${suffix}`;
  const email = `e2e_${suffix}@example.com`;
  const password = 'Password123!';

  await page.goto('/register');

  await page.getByLabel('Usuario').fill(username);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Registrarse' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByLabel('Ir a perfil')).toBeVisible();
});

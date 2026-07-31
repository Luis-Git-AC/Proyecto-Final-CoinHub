import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:5051/api';

test('login y añadir cripto al portfolio', async ({ page, request }) => {
  const suffix = Date.now();
  const username = `e2e_portfolio_${suffix}`;
  const email = `e2e_portfolio_${suffix}@example.com`;
  const password = 'Password123!';

  // Cuenta creada vía API directa (con un cliente de request separado del
  // contexto del navegador, para no dejar cookies de sesión ya puestas) —
  // el registro por UI ya se cubre en register.spec.ts. Esto deja este test
  // centrado en probar el formulario de LOGIN de verdad.
  const registerRes = await request.post(`${API_URL}/auth/register`, {
    data: { username, email, password },
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(registerRes.ok()).toBeTruthy();

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByLabel('Ir a perfil')).toBeVisible();

  await page.goto('/criptos');
  const firstCard = page.getByRole('article').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });

  const coinName = (await firstCard.locator('h3').innerText()).trim();
  // El botón de favoritos no tiene aria-label propio: su nombre accesible es
  // el glifo que renderiza ('☆' = no está en portfolio, '★' = sí lo está).
  await firstCard.getByRole('button', { name: '☆' }).click();

  // Navegación in-app (no page.goto) para no perder el estado en memoria de
  // PortfolioProvider con un remount completo de la aplicación.
  await page.getByRole('link', { name: 'Portfolio' }).click();
  await expect(page).toHaveURL('/portfolio');
  await expect(page.getByText(coinName, { exact: false }).first()).toBeVisible();
});

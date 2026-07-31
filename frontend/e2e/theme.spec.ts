import { test, expect } from '@playwright/test';

test('cambio de tema claro/oscuro y persistencia', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');

  const initialIsLight = (await html.getAttribute('data-theme')) === 'light';

  // Cambia al tema contrario.
  const toggleLabel = initialIsLight ? /Activar modo oscuro/ : /Activar modo claro/;
  await page.getByRole('button', { name: toggleLabel }).click();
  if (initialIsLight) {
    await expect(html).not.toHaveAttribute('data-theme', 'light');
  } else {
    await expect(html).toHaveAttribute('data-theme', 'light');
  }

  // El cambio persiste en localStorage tras recargar la página.
  await page.reload();
  if (initialIsLight) {
    await expect(html).not.toHaveAttribute('data-theme', 'light');
  } else {
    await expect(html).toHaveAttribute('data-theme', 'light');
  }

  // Y se puede volver al estado inicial.
  const backLabel = initialIsLight ? /Activar modo claro/ : /Activar modo oscuro/;
  await page.getByRole('button', { name: backLabel }).click();
  if (initialIsLight) {
    await expect(html).toHaveAttribute('data-theme', 'light');
  } else {
    await expect(html).not.toHaveAttribute('data-theme', 'light');
  }
});

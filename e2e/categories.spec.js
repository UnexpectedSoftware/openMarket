const fs = require('fs');
const path = require('path');
const {test, expect} = require('@playwright/test');
const {
  root,
  assertDist,
  launchApp,
  closeApp,
  euros,
  chooseMenu,
  orderRow,
  scanBarcode,
  confirmPayment,
  dismissTicket
} = require('./launch');

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

function fact(card, label) {
  return card.locator('.category-card-facts div', {
    hasText: new RegExp(`^${label}`)
  }).locator('dd');
}

function cardNamed(window, name) {
  return window.locator('.category-card').filter({
    has: window.locator('.category-card-name', {hasText: new RegExp(`^${name}$`)})
  });
}

async function openCategories(window) {
  await window.getByRole('link', {name: 'Categorías', exact: true}).click();
  await expect(window.getByRole('heading', {name: 'Categorías', exact: true})).toBeVisible();
}

function newCategory(window) {
  return window.locator('.om-page-header').getByRole('button', {name: 'Nueva categoría'});
}

test.beforeAll(() => {
  assertDist();
});

test('creates categories from the dialog', async () => {
  const {app, window, userData} = await launchApp();
  const image = path.join(userData, 'pixel.png');
  const text = path.join(userData, 'note.txt');
  try {
    await openCategories(window);
    await expect(window.getByText('Aún no hay categorías')).toBeVisible();
    await expect(window.getByText('Crea la primera categoría para agrupar los productos.')).toBeVisible();
    await expect(window.getByRole('button', {name: 'Nueva categoría'})).toHaveCount(2);
    await expect(window.locator('.category-card.is-draft')).toHaveCount(0);
    await expect(window.locator('.category-card')).toHaveCount(0);

    await newCategory(window).click();
    const dialog = window.getByRole('dialog');
    await expect(dialog.getByRole('heading', {name: 'Nueva categoría'})).toBeVisible();
    await expect(dialog.getByRole('textbox', {name: 'Nombre'})).toBeFocused();
    await dialog.getByRole('button', {name: 'Guardar'}).click();
    await expect(dialog.getByText('Obligatorio')).toBeVisible();
    await expect(window.locator('.category-card')).toHaveCount(0);

    await dialog.locator('input[type="file"]').setInputFiles(text);
    await expect(dialog.locator('.error')).toHaveText('Usa una imagen JPEG, PNG, GIF o WebP');
    await expect(window.locator('.category-card')).toHaveCount(0);

    await dialog.getByRole('button', {name: 'Cancelar'}).click();
    await expect(dialog).toHaveCount(0);

    await newCategory(window).click();
    await dialog.getByRole('textbox', {name: 'Nombre'}).fill('Inline Plain');
    await dialog.getByRole('textbox', {name: 'Nombre'}).press('Enter');
    await expect(cardNamed(window, 'Inline Plain')).toBeVisible();
    await expect(window.getByText('Categoría guardada')).toBeVisible();

    await newCategory(window).click();
    await dialog.locator('input[type="file"]').setInputFiles(image);
    await expect(dialog.locator('img')).toHaveAttribute('src', /^blob:/);
    await dialog.getByRole('textbox', {name: 'Nombre'}).fill('Inline Photo');
    await dialog.getByRole('button', {name: 'Guardar'}).click();
    await expect(cardNamed(window, 'Inline Photo').locator('img')).toHaveAttribute('src', /^data:image\/png/);

    await window.reload();
    await openCategories(window);
    await expect(cardNamed(window, 'Inline Plain').locator('img')).not.toHaveAttribute('src', /^data:image/);
    await expect(cardNamed(window, 'Inline Photo').locator('img')).toHaveAttribute('src', /^data:image\/png/);

    await window.evaluate(() => {
      location.hash = '#/create_product';
    });
    await expect(window.locator('select option', {hasText: 'Inline Plain'})).toHaveCount(1);
    await expect(window.locator('select option', {hasText: 'Inline Photo'})).toHaveCount(1);
  } finally {
    await closeApp(app, userData);
  }
});

test('edits a category in the dialog', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: [
        {name: 'Inline Plain'},
        {name: 'Inline Photo', image: true}
      ]
    }
  });
  const image = path.join(userData, 'pixel.png');
  try {
    await openCategories(window);
    const photo = cardNamed(window, 'Inline Photo');
    await expect(photo.locator('img')).toHaveAttribute('src', /^data:image\/png/);

    await cardNamed(window, 'Inline Plain').getByRole('button', {name: 'Editar'}).click();
    const dialog = window.getByRole('dialog');
    await expect(dialog.getByRole('heading', {name: 'Editar categoría'})).toBeVisible();
    await dialog.getByRole('textbox', {name: 'Nombre'}).fill('Inline Plain renamed');
    await dialog.getByRole('button', {name: 'Guardar'}).click();
    await expect(cardNamed(window, 'Inline Plain renamed')).toBeVisible();
    await expect(window.getByText('Cambios aplicados')).toBeVisible();

    await photo.getByRole('button', {name: 'Editar'}).click();
    await dialog.getByRole('textbox', {name: 'Nombre'}).fill('nope');
    await dialog.getByRole('button', {name: 'Cancelar'}).click();
    await expect(cardNamed(window, 'Inline Photo')).toBeVisible();
    await expect(cardNamed(window, 'nope')).toHaveCount(0);

    await photo.getByRole('button', {name: 'Editar'}).click();
    await dialog.getByRole('textbox', {name: 'Nombre'}).fill('   ');
    await dialog.getByRole('button', {name: 'Guardar'}).click();
    await expect(dialog.getByText('Obligatorio')).toBeVisible();
    await dialog.getByRole('button', {name: 'Cancelar'}).click();
    await expect(cardNamed(window, 'Inline Photo')).toBeVisible();

    await cardNamed(window, 'Inline Plain renamed').getByRole('button', {name: 'Editar'}).click();
    await dialog.locator('input[type="file"]').setInputFiles(image);
    await dialog.getByRole('button', {name: 'Guardar'}).click();
    await expect(cardNamed(window, 'Inline Plain renamed').locator('img')).toHaveAttribute('src', /^data:image\/png/);

    await photo.getByRole('button', {name: 'Editar'}).click();
    await dialog.getByRole('button', {name: 'Usar imagen por defecto'}).click();
    await dialog.getByRole('button', {name: 'Guardar'}).click();
    await expect(photo.locator('img')).not.toHaveAttribute('src', /^data:image/);

    await window.reload();
    await openCategories(window);
    await expect(cardNamed(window, 'Inline Plain renamed').locator('img')).toHaveAttribute('src', /^data:image\/png/);
    await expect(cardNamed(window, 'Inline Photo').locator('img')).not.toHaveAttribute('src', /^data:image/);

    await window.getByRole('textbox', {name: 'Buscar por nombre'}).fill('zzz');
    await expect(window.getByText('Ninguna categoría coincide con la búsqueda')).toBeVisible();
    await window.getByRole('button', {name: 'Quitar búsqueda'}).click();
    await expect(cardNamed(window, 'Inline Photo')).toBeVisible();
    await expect(cardNamed(window, 'Inline Plain renamed')).toBeVisible();

    await app.evaluate(({BrowserWindow}) => {
      const browserWindow = BrowserWindow.getAllWindows()[0];
      browserWindow.setMinimumSize(380, 700);
      browserWindow.setContentSize(380, 720);
    });
    await window.evaluate(() => {
      location.hash = '#/categories';
    });
    await expect(cardNamed(window, 'Inline Photo')).toBeVisible();
    const cards = window.locator('.category-card');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1);
  } finally {
    await closeApp(app, userData);
  }
});

test('shows totals and deletes an empty category', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Empty Shelf', 'Stocked'],
      products: [{
        name: 'Milk',
        barcode: '8400000000011',
        price: 2,
        basePrice: 1.5,
        stock: 4,
        stockMin: 1,
        category: 'Stocked'
      }]
    }
  });
  try {
    await openCategories(window);
    const empty = cardNamed(window, 'Empty Shelf');
    await expect(fact(empty, 'Productos')).toHaveText('0');
    await expect(fact(empty, 'Valor')).toHaveText(euros(0));
    await expect(fact(empty, 'Stock')).toHaveText('0');
    await expect(fact(empty, 'Más vendido')).toHaveText('—');
    await expect(empty.getByRole('button', {name: 'Eliminar categoría'})).toBeVisible();

    const stocked = cardNamed(window, 'Stocked');
    await expect(fact(stocked, 'Productos')).toHaveText('1');
    await expect(fact(stocked, 'Valor')).toHaveText(euros(1.5));
    await expect(fact(stocked, 'Stock')).toHaveText('4');
    await expect(fact(stocked, 'Más vendido')).toHaveText('—');
    await expect(stocked.getByRole('button', {name: 'Eliminar categoría'})).toHaveCount(0);

    await chooseMenu(window, 'Orders', 'new Order!');
    await expect(window.getByRole('heading', {name: 'Vender'})).toBeVisible();
    await scanBarcode(window, '8400000000011');
    await expect(orderRow(window, 'Milk').locator('input')).toHaveValue('1');
    await window.getByRole('button', {name: 'Cobrar'}).click();
    await confirmPayment(window);
    await dismissTicket(window);

    await openCategories(window);
    const sold = cardNamed(window, 'Stocked');
    await expect(fact(sold, 'Productos')).toHaveText('1');
    await expect(fact(sold, 'Valor')).toHaveText(euros(1.5));
    await expect(fact(sold, 'Stock')).toHaveText('3');
    await expect(fact(sold, 'Más vendido')).toHaveText('Milk');
    await fact(sold, 'Más vendido').getByRole('link', {name: 'Milk'}).click();
    await expect(window.getByRole('heading', {name: "Let's edit a product!"})).toBeVisible();
    await expect(window.locator('input[name="name"]')).toHaveValue('Milk');
    await openCategories(window);

    const emptyAgain = cardNamed(window, 'Empty Shelf');
    window.once('dialog', async (nativeDialog) => {
      expect(nativeDialog.message()).toBe('¿Eliminar Empty Shelf?');
      await nativeDialog.accept();
    });
    await emptyAgain.getByRole('button', {name: 'Eliminar categoría'}).click();
    await expect(window.getByRole('heading', {name: 'Categoría eliminada'})).toBeVisible();
    await expect(cardNamed(window, 'Empty Shelf')).toHaveCount(0);

    await window.evaluate(() => {
      location.hash = '#/create_product';
    });
    await expect(window.locator('select option', {hasText: 'Empty Shelf'})).toHaveCount(0);
    await expect(window.locator('select option', {hasText: 'Stocked'})).toHaveCount(1);
  } finally {
    await closeApp(app, userData);
  }
});

test('screenshots the grid and the edit dialog in the four themes', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: [
        {name: 'Lácteos', image: true},
        {name: 'Fruta'},
        {name: 'Panadería'},
        'Limpieza'
      ],
      products: [{
        name: 'Leche',
        barcode: '8400000001018',
        price: 2,
        basePrice: 1.5,
        stock: 4,
        stockMin: 1,
        category: 'Lácteos'
      }]
    }
  });
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await openCategories(window);
    await expect(cardNamed(window, 'Lácteos')).toBeVisible();
    await expect(fact(cardNamed(window, 'Lácteos'), 'Productos')).toHaveText('1');

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `categories-${theme}.png`)});
    }

    await cardNamed(window, 'Lácteos').getByRole('button', {name: 'Editar'}).click();
    await expect(window.getByRole('heading', {name: 'Editar categoría'})).toBeVisible();
    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `categories-dialog-${theme}.png`)});
    }
  } finally {
    await closeApp(app, userData);
  }
});

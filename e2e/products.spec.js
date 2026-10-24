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
  fillProduct,
  productRow,
  openProductList,
  scanBarcode
} = require('./launch');

const THEMES = ['mercado', 'mostrador-noche', 'ultramarinos', 'unexpected-neon'];

test.beforeAll(() => {
  assertDist();
});

test('shows how to create the first product', async () => {
  const {app, window, userData} = await launchApp();
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await openProductList(window);
    await expect(window.getByText('Aún no hay productos')).toBeVisible();
    await expect(window.getByText('Crea el primer producto para venderlo.')).toBeVisible();
    await expect(window.getByRole('link', {name: 'Crear producto', exact: true})).toBeVisible();
  } finally {
    await closeApp(app, userData);
  }
});

test('creates a product', async () => {
  const {app, window, userData} = await launchApp({
    shop: {categories: ['Dairy']}
  });
  try {
    await chooseMenu(window, 'Products', 'new Product!');
    const drawer = window.getByRole('dialog');
    await expect(drawer.getByRole('heading', {name: 'Nuevo producto'})).toBeVisible();
    await drawer.getByRole('button', {name: 'Guardar'}).click();
    await expect(drawer.getByRole('alert').filter({hasText: 'Obligatorio'}).first()).toBeVisible();
    await expect(window.getByText('Producto guardado')).toHaveCount(0);

    await fillProduct(window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1,
      stock: 10,
      stockMin: 2,
      category: 'Dairy'
    });
    await drawer.getByRole('button', {name: 'Guardar'}).click();
    await expect(window.getByText('Producto guardado')).toBeVisible();
    await expect(drawer.getByRole('heading', {name: 'Nuevo producto'})).toHaveCount(0);

    const row = productRow(window, 'Milk');
    await expect(row).toBeVisible();
    await expect(row).toContainText('8400000000011');
    await expect(row.locator('.products-stock-qty')).toHaveText('10');
    await expect(row.getByText('Activo', {exact: true})).toBeVisible();
    await expect(row).toContainText('50 %');
    await expect(row).toContainText(euros(2));
  } finally {
    await closeApp(app, userData);
  }
});

test('edits a product from the catalog', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Dairy'],
      products: [{
        name: 'Milk',
        barcode: '8400000000011',
        price: 2,
        basePrice: 1,
        stock: 10,
        stockMin: 2,
        category: 'Dairy'
      }]
    }
  });
  try {
    await openProductList(window);
    await productRow(window, 'Milk').getByRole('button', {name: 'Editar'}).click();

    const drawer = window.getByRole('dialog');
    await expect(drawer.getByRole('heading', {name: 'Editar producto'})).toBeVisible();
    const barcode = drawer.locator('input[name="barcode"]');
    await expect(barcode).toHaveValue('8400000000011');
    await expect(barcode).toHaveAttribute('readonly', '');
    await expect(drawer.locator('input[name="name"]')).toHaveValue('Milk');
    await expect(drawer.locator('input[name="price"]')).toHaveValue('2');
    await expect(drawer.getByRole('switch', {name: 'Activo'})).toBeVisible();

    await drawer.locator('input[name="name"]').fill('Whole milk');
    await drawer.locator('input[name="price"]').fill('3');
    await drawer.locator('select[name="vatRate"]').selectOption('S1:10');
    await drawer.getByRole('button', {name: 'Guardar'}).click();
    await expect(window.getByText('Producto guardado')).toBeVisible();
    await expect(drawer.getByRole('heading', {name: 'Editar producto'})).toHaveCount(0);

    await expect(productRow(window, 'Milk')).toHaveCount(0);
    const row = productRow(window, 'Whole milk');
    await expect(row).toBeVisible();
    await expect(row).toContainText(euros(3));
    await row.getByRole('button', {name: 'Editar'}).click();
    await expect(window.locator('select[name="vatRate"]')).toHaveValue('S1:10');
  } finally {
    await closeApp(app, userData);
  }
});

test('filters the catalog and disables a product', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Dairy', 'Bakery'],
      products: [
        {
          name: 'Milk',
          barcode: '8400000000011',
          price: 2,
          basePrice: 1,
          stock: 10,
          stockMin: 2,
          category: 'Dairy'
        },
        {
          name: 'Bread',
          barcode: '8400000000028',
          price: 1,
          basePrice: 1,
          stock: 1,
          stockMin: 3,
          category: 'Bakery'
        }
      ]
    }
  });
  try {
    await openProductList(window);
    await expect(window.getByRole('button', {name: 'Print product list'})).toBeVisible();
    await expect(window.locator('.products-name')).toHaveCount(2);
    await expect(window.getByText('Mostrando 1–2 de 2')).toBeVisible();

    const sort = window.getByLabel('Ordenar por nombre');
    await expect(sort).toHaveValue('name_asc');
    await expect(window.locator('.products-name')).toHaveText(['Bread', 'Milk']);
    await sort.selectOption({label: 'stock bajo–alto'});
    await expect(window.locator('.products-name')).toHaveText(['Bread', 'Milk']);
    await sort.selectOption({label: 'stock alto–bajo'});
    await expect(window.locator('.products-name')).toHaveText(['Milk', 'Bread']);
    await sort.selectOption({label: 'nombre Z–A'});
    await expect(window.locator('.products-name')).toHaveText(['Milk', 'Bread']);
    await sort.selectOption({label: 'nombre A–Z'});
    await expect(window.locator('.products-name')).toHaveText(['Bread', 'Milk']);

    const search = window.getByLabel('Buscar por nombre o código');
    await search.fill('Mil');
    await expect(productRow(window, 'Milk')).toBeVisible();
    await expect(productRow(window, 'Bread')).toHaveCount(0);
    await search.fill('8400000000028');
    await expect(productRow(window, 'Bread')).toBeVisible();
    await expect(productRow(window, 'Milk')).toHaveCount(0);
    await search.fill('');
    await expect(window.locator('.products-name')).toHaveCount(2);

    await search.fill('zzz');
    await expect(window.getByText('Ningún producto coincide con estos filtros')).toBeVisible();
    await window.getByRole('button', {name: 'Quitar filtros'}).click();
    await expect(window.locator('.products-name')).toHaveText(['Bread', 'Milk']);

    await window.getByRole('button', {name: 'Stock bajo', exact: true}).click();
    await expect(productRow(window, 'Bread')).toBeVisible();
    await expect(productRow(window, 'Milk')).toHaveCount(0);
    await window.getByRole('button', {name: 'Stock bajo', exact: true}).click();
    await expect(window.locator('.products-name')).toHaveCount(2);

    await window.getByLabel('Categoría').selectOption({label: 'Dairy'});
    await expect(productRow(window, 'Milk')).toBeVisible();
    await expect(productRow(window, 'Bread')).toHaveCount(0);
    await window.getByLabel('Categoría').selectOption({label: 'Todas'});
    await expect(window.locator('.products-name')).toHaveCount(2);

    await expect(window.getByRole('button', {name: 'Desactivar'})).toHaveCount(0);
    const milk = productRow(window, 'Milk');
    await archiveProduct(window, 'Milk');
    await expect(milk.getByText('Inactivo', {exact: true})).toBeVisible();
    await expect(window.locator('.products-name')).toHaveText(['Bread', 'Milk']);

    await window.getByRole('button', {name: 'Activos', exact: true}).click();
    await expect(productRow(window, 'Bread')).toBeVisible();
    await expect(productRow(window, 'Milk')).toHaveCount(0);

    await window.getByRole('button', {name: 'Inactivos', exact: true}).click();
    await expect(productRow(window, 'Milk')).toBeVisible();
    await expect(productRow(window, 'Bread')).toHaveCount(0);

    await window.getByRole('button', {name: 'Todos', exact: true}).click();
    await expect(window.locator('.products-name')).toHaveCount(2);

    await archiveProduct(window, 'Bread');
    await expect(productRow(window, 'Bread').getByText('Inactivo', {exact: true})).toBeVisible();
    await window.getByRole('button', {name: 'Stock bajo', exact: true}).click();
    await expect(productRow(window, 'Bread')).toBeVisible();
    await expect(productRow(window, 'Milk')).toHaveCount(0);
    await window.getByRole('button', {name: 'Activos', exact: true}).click();
    await expect(productRow(window, 'Bread')).toHaveCount(0);
    await expect(productRow(window, 'Milk')).toHaveCount(0);
    await expect(window.getByText('Ningún producto coincide con estos filtros')).toBeVisible();
    await window.getByRole('button', {name: 'Todos', exact: true}).click();
    await window.getByRole('button', {name: 'Stock bajo', exact: true}).click();

    await chooseMenu(window, 'Orders', 'new Order!');
    await expect(window.getByRole('heading', {name: "Vender"})).toBeVisible();
    await scanBarcode(window, '8400000000011');
    await expect(window.getByText('Product enabled')).toBeVisible();
    await expect(window.getByText('Milk has been enabled again and the stock was increased by +1.')).toBeVisible();
    const quantity = window.locator('.sell-line').filter({hasText: 'Milk'}).locator('input');
    await expect(quantity).toHaveValue('1');
    await expect(window.getByText('Order saved!')).toHaveCount(0);
  } finally {
    await closeApp(app, userData);
  }
});

test('screenshots the table in every theme', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Lácteos', 'Fruta', 'Panadería'],
      products: [
        {
          name: 'Leche',
          barcode: '8400000001018',
          price: 2,
          basePrice: 1,
          stock: 20,
          stockMin: 4,
          category: 'Lácteos'
        },
        {
          name: 'Manzana',
          barcode: '8400000001025',
          price: 1.2,
          basePrice: 0.7,
          stock: 12.4,
          stockMin: 2,
          weighted: true,
          category: 'Fruta'
        },
        {
          name: 'Pan',
          barcode: '8400000001032',
          price: 1,
          basePrice: 0.4,
          stock: 1,
          stockMin: 3,
          category: 'Panadería'
        },
        {
          name: 'Queso',
          barcode: '8400000001049',
          price: 3,
          basePrice: 2,
          stock: 4,
          stockMin: 1,
          status: 'DISABLED',
          category: 'Lácteos'
        }
      ]
    }
  });
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await openProductList(window);
    await expect(productRow(window, 'Leche')).toContainText('50 %');
    await expect(productRow(window, 'Leche').getByText('Activo', {exact: true})).toBeVisible();
    await expect(productRow(window, 'Manzana').locator('.products-stock-qty')).toHaveText('12,4 kg');
    await expect(productRow(window, 'Manzana')).toContainText('42 %');
    await expect(productRow(window, 'Pan').getByText('bajo', {exact: true})).toBeVisible();
    await expect(productRow(window, 'Queso').getByText('Inactivo', {exact: true})).toBeVisible();

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `products-${theme}.png`)});
    }
  } finally {
    await closeApp(app, userData);
  }
});

test('screenshots the drawer in every theme', async () => {
  const {app, window, userData} = await launchApp({
    shop: {
      categories: ['Lácteos'],
      products: [{
        name: 'Leche',
        barcode: '8400000001018',
        price: 1.85,
        basePrice: 1.15,
        stock: 20,
        stockMin: 4,
        category: 'Lácteos'
      }]
    }
  });
  const after = path.join(root, 'docs/design/after');
  fs.mkdirSync(after, {recursive: true});
  try {
    await window.setViewportSize({width: 1366, height: 768});
    await openProductList(window);
    await productRow(window, 'Leche').getByRole('button', {name: 'Editar'}).click();
    const drawer = window.getByRole('dialog');
    await expect(drawer.getByRole('heading', {name: 'Editar producto'})).toBeVisible();
    await expect(drawer.getByRole('switch', {name: 'Activo'})).toBeVisible();
    await expect(drawer.locator('input[name="barcode"]')).toHaveAttribute('readonly', '');
    await expect(drawer.getByText('38 %')).toBeVisible();

    for (const theme of THEMES) {
      await window.evaluate(name => {
        document.documentElement.dataset.theme = name;
      }, theme);
      await expect.poll(() => window.evaluate(() => document.documentElement.dataset.theme)).toBe(theme);
      await window.screenshot({path: path.join(after, `products-drawer-${theme}.png`)});
    }
  } finally {
    await closeApp(app, userData);
  }
});

async function archiveProduct(window, name) {
  await productRow(window, name).getByRole('button', {name: 'Editar'}).click();
  const drawer = window.getByRole('dialog', {name: 'Editar producto'});
  await expect(drawer.getByRole('heading', {name: 'Editar producto'})).toBeVisible();
  await drawer.getByRole('button', {name: 'Eliminar'}).click();
  await window.getByRole('alertdialog').getByRole('button', {name: 'Desactivar'}).click();
  await expect(window.getByRole('heading', {name: 'Editar producto'})).toHaveCount(0);
}

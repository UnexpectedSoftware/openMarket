const {test, expect} = require('@playwright/test');
const path = require('path');
const {
  root,
  assertDist,
  launchApp,
  closeApp,
  euros,
  chooseMenu,
  createCategory,
  createProduct,
  orderRow,
  scanBarcode,
  dismissTicket
} = require('./launch');

function fact(card, label) {
  return card.locator('.category-card-facts div', {
    hasText: new RegExp(`^${label}`)
  }).locator('dd');
}

async function cardNamed(window, name) {
  let match = -1;
  await expect.poll(async () => {
    const values = await window.locator('.category-card:not(.is-draft) .category-card-name').evaluateAll(
      nodes => nodes.map(node => node.value)
    );
    match = values.indexOf(name);
    return match;
  }).toBeGreaterThanOrEqual(0);
  return window.locator('.category-card:not(.is-draft)').nth(match);
}

test.beforeAll(() => {
  assertDist();
});

test('creates a category from the blank card', async () => {
  const {app, window, userData} = await launchApp();
  const image = path.join(userData, 'pixel.png');
  const text = path.join(userData, 'note.txt');
  try {
    await window.getByRole('link', {name: 'Categories'}).click();
    const draft = window.locator('.category-card.is-draft');
    await expect(draft).toBeVisible();
    await expect(window.locator('.category-add')).toHaveCount(0);
    await expect(window.locator('.category-cards > :first-child')).toHaveClass(/is-draft/);
    await expect(window.locator('.category-card:not(.is-draft)')).toHaveCount(0);
    await expect(draft.getByRole('button', {name: 'Save'})).toBeDisabled();

    await draft.getByRole('textbox', {name: 'Category name'}).focus();
    await draft.getByRole('textbox', {name: 'Category name'}).blur();
    await expect(draft.locator('.category-card-error')).toHaveText('Required');
    await expect(window.locator('.category-card:not(.is-draft)')).toHaveCount(0);

    await draft.locator('input[type="file"]').setInputFiles(text);
    await expect(draft.locator('.category-card-error')).toHaveText('Use a JPEG, PNG, GIF, or WebP image');

    await draft.getByRole('textbox', {name: 'Category name'}).fill('Inline Plain');
    await draft.getByRole('button', {name: 'Save'}).click();
    await expect(await cardNamed(window, 'Inline Plain')).toBeVisible();
    await expect(draft.getByRole('textbox', {name: 'Category name'})).toHaveValue('');
    await expect(window.getByText('Category saved!')).toBeVisible();

    await draft.locator('input[type="file"]').setInputFiles(image);
    await expect(draft.locator('img')).toHaveAttribute('src', /^blob:/);
    await draft.getByRole('textbox', {name: 'Category name'}).fill('Inline Photo');
    await draft.getByRole('button', {name: 'Save'}).click();
    const photo = await cardNamed(window, 'Inline Photo');
    await expect(photo.locator('img')).toHaveAttribute('src', /^data:image\/png/);
    await expect(draft.getByRole('textbox', {name: 'Category name'})).toHaveValue('');

    await window.reload();
    await window.getByRole('link', {name: 'Categories'}).click();
    await expect((await cardNamed(window, 'Inline Plain')).locator('img')).not.toHaveAttribute('src', /^data:image/);
    await expect((await cardNamed(window, 'Inline Photo')).locator('img')).toHaveAttribute('src', /^data:image\/png/);
    await expect(draft.getByRole('textbox', {name: 'Category name'})).toHaveValue('');

    await window.evaluate(() => {
      location.hash = '#/create_product';
    });
    await expect(window.locator('select option', {hasText: 'Inline Plain'})).toHaveCount(1);
    await expect(window.locator('select option', {hasText: 'Inline Photo'})).toHaveCount(1);
  } finally {
    await closeApp(app, userData);
  }
});

test('edits a category on the card', async () => {
  const {app, window, userData} = await launchApp();
  const image = path.join(userData, 'pixel.png');
  try {
    await window.getByRole('link', {name: 'Categories'}).click();
    const draft = window.locator('.category-card.is-draft');
    await draft.getByRole('textbox', {name: 'Category name'}).fill('Inline Plain');
    await draft.getByRole('button', {name: 'Save'}).click();
    await draft.locator('input[type="file"]').setInputFiles(image);
    await draft.getByRole('textbox', {name: 'Category name'}).fill('Inline Photo');
    await draft.getByRole('button', {name: 'Save'}).click();
    const photo = await cardNamed(window, 'Inline Photo');
    await expect(photo.locator('img')).toHaveAttribute('src', /^data:image\/png/);

    const plain = await cardNamed(window, 'Inline Plain');
    await plain.locator('.category-card-name').fill('Inline Plain renamed');
    await plain.locator('.category-card-name').blur();
    await expect(plain.locator('.category-card-name')).toHaveValue('Inline Plain renamed');
    await expect(window.getByText('Changes applied')).toBeVisible();

    const photoName = photo.locator('.category-card-name');
    await photoName.fill('nope');
    await photoName.press('Escape');
    await expect(photoName).toHaveValue('Inline Photo');

    await photoName.fill('   ');
    await photoName.blur();
    await expect(photo.locator('.category-card-error')).toHaveText('Required');
    await photoName.press('Escape');
    await expect(photoName).toHaveValue('Inline Photo');

    const imageBox = await photo.locator('img').boundingBox();
    const changeBox = await photo.getByRole('button', {name: 'Change image'}).boundingBox();
    const clearBox = await photo.getByRole('button', {name: 'Use default image'}).boundingBox();
    expect(changeBox.y).toBeGreaterThanOrEqual(imageBox.y);
    expect(changeBox.x + changeBox.width).toBeLessThanOrEqual(imageBox.x + imageBox.width + 1);
    expect(clearBox.x + clearBox.width).toBeLessThanOrEqual(changeBox.x + 1);

    const renamed = await cardNamed(window, 'Inline Plain renamed');
    await renamed.locator('input[type="file"]').setInputFiles(image);
    await expect(renamed.locator('img')).toHaveAttribute('src', /^data:image\/png/);
    await expect(renamed.getByRole('button', {name: 'Use default image'})).toBeVisible();

    await photo.getByRole('button', {name: 'Use default image'}).click();
    await expect(photo.locator('img')).not.toHaveAttribute('src', /^data:image/);
    await expect(photo.getByRole('button', {name: 'Use default image'})).toHaveCount(0);

    await window.screenshot({path: path.join(root, 'test-results/categories.png')});

    await window.reload();
    await window.getByRole('link', {name: 'Categories'}).click();
    await expect((await cardNamed(window, 'Inline Plain renamed')).locator('img')).toHaveAttribute('src', /^data:image\/png/);
    await expect((await cardNamed(window, 'Inline Photo')).locator('img')).not.toHaveAttribute('src', /^data:image/);

    await app.evaluate(({BrowserWindow}) => {
      BrowserWindow.getAllWindows()[0].setContentSize(380, 720);
    });
    await window.evaluate(() => {
      location.hash = '#/categories';
    });
    await expect(draft).toBeVisible();
    const cards = window.locator('.category-card');
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(second.y).toBeGreaterThanOrEqual(first.y + first.height - 1);
    const narrowImage = await cards.nth(1).locator('img').boundingBox();
    const narrowChange = await cards.nth(1).getByRole('button', {name: 'Change image'}).boundingBox();
    expect(narrowChange.y).toBeGreaterThanOrEqual(narrowImage.y);
    expect(narrowChange.x + narrowChange.width).toBeLessThanOrEqual(narrowImage.x + narrowImage.width + 1);
    await window.screenshot({path: path.join(root, 'test-results/categories-narrow.png')});
  } finally {
    await closeApp(app, userData);
  }
});

test('shows totals and deletes an empty category', async () => {
  test.setTimeout(120000);
  const {app, window, userData} = await launchApp();
  try {
    await createCategory(window, 'Empty Shelf');
    await createCategory(window, 'Stocked');
    const empty = await cardNamed(window, 'Empty Shelf');
    await expect(fact(empty, 'Products')).toHaveText('0');
    await expect(fact(empty, 'Value')).toHaveText(euros(0));
    await expect(fact(empty, 'Stock')).toHaveText('0');
    await expect(fact(empty, 'Most sold')).toHaveText('—');

    const photo = await empty.locator('img').boundingBox();
    const change = await empty.getByRole('button', {name: 'Change image'}).boundingBox();
    const nameBox = await empty.locator('.category-card-name').boundingBox();
    const deleteButton = empty.getByRole('button', {name: 'Delete category'});
    const deleteBox = await deleteButton.boundingBox();
    expect(change.y).toBeGreaterThanOrEqual(photo.y);
    expect(change.x + change.width).toBeLessThanOrEqual(photo.x + photo.width + 1);
    expect(deleteBox.y).toBeGreaterThanOrEqual(photo.y + photo.height - 1);
    expect(deleteBox.y).toBeGreaterThanOrEqual(nameBox.y + nameBox.height - 1);

    await createProduct(window, {
      name: 'Milk',
      barcode: '8400000000011',
      price: 2,
      basePrice: 1.5,
      stock: 4,
      stockMin: 1,
      category: 'Stocked'
    });
    await window.getByRole('link', {name: 'Categories'}).click();
    const stocked = await cardNamed(window, 'Stocked');
    await expect(fact(stocked, 'Products')).toHaveText('1');
    await expect(fact(stocked, 'Value')).toHaveText(euros(1.5));
    await expect(fact(stocked, 'Stock')).toHaveText('4');
    await expect(fact(stocked, 'Most sold')).toHaveText('—');
    await expect(stocked.getByRole('button', {name: 'Delete category'})).toHaveCount(0);

    await chooseMenu(window, 'Orders', 'new Order!');
    await expect(window.getByRole('heading', {name: "Let's create a new order!"})).toBeVisible();
    await scanBarcode(window, '8400000000011');
    await expect(orderRow(window, 'Milk').locator('input')).toHaveValue('1');
    await window.locator('h3 a.button', {hasText: 'Save'}).click();
    await dismissTicket(window);

    await window.getByRole('link', {name: 'Categories'}).click();
    const sold = await cardNamed(window, 'Stocked');
    await expect(fact(sold, 'Products')).toHaveText('1');
    await expect(fact(sold, 'Value')).toHaveText(euros(1.5));
    await expect(fact(sold, 'Stock')).toHaveText('3');
    await expect(fact(sold, 'Most sold')).toHaveText('Milk');
    await fact(sold, 'Most sold').getByRole('link', {name: 'Milk'}).click();
    await expect(window.getByRole('heading', {name: "Let's edit a product!"})).toBeVisible();
    await expect(window.locator('input[name="name"]')).toHaveValue('Milk');
    await window.getByRole('link', {name: 'Categories'}).click();

    const emptyAgain = await cardNamed(window, 'Empty Shelf');
    window.once('dialog', async (dialog) => {
      expect(dialog.message()).toBe('Delete Empty Shelf?');
      await dialog.accept();
    });
    await emptyAgain.getByRole('button', {name: 'Delete category'}).click();
    await expect(window.getByRole('heading', {name: 'Category deleted'})).toBeVisible();
    await expect.poll(async () => {
      const values = await window.locator('.category-card:not(.is-draft) .category-card-name').evaluateAll(
        nodes => nodes.map(node => node.value)
      );
      return values.includes('Empty Shelf');
    }).toBe(false);

    await window.evaluate(() => {
      location.hash = '#/create_product';
    });
    await expect(window.locator('select option', {hasText: 'Empty Shelf'})).toHaveCount(0);
    await expect(window.locator('select option', {hasText: 'Stocked'})).toHaveCount(1);
  } finally {
    await closeApp(app, userData);
  }
});

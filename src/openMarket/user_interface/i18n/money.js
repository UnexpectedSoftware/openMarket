const euros = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR'
});

export function formatMoney(amount) {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return '';
  }
  return euros.format(value);
}

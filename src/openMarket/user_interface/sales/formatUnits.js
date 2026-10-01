const units = new Intl.NumberFormat('es-ES', {maximumFractionDigits: 3});

export function formatUnits(quantity) {
  const value = Number(quantity);
  if (!Number.isFinite(value)) {
    return '';
  }
  return units.format(value);
}

import TaxId from '../../domain/shop/TaxId';

/**
 * The demo shop named on the rail and on tickets.
 * @returns {object}
 */
export function buildProfile() {
  return {
    nif: TaxId.parse('12345678Z').value,
    legalName: 'Ana Ruiz García',
    tradeName: 'Ultramarinos La Plaza',
    address: {
      street: 'Calle Mayor 12',
      postalCode: '28013',
      city: 'Madrid',
      province: 'Madrid',
      country: 'ES'
    },
    timeZone: 'Europe/Madrid',
    invoicingEnabled: true,
    phone: '913456789',
    email: 'hola@ultramarinoslaplaza.example'
  };
}

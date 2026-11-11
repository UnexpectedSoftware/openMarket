/**
 * The demo shop named on the rail and on tickets, as the Ajustes form sends it
 * to UpdateShopProfile.
 * @returns {{nif: string, legalName: string, tradeName: string, street: string, postalCode: string, city: string, province: string, country: string, phone: string, email: string, invoicingEnabled: boolean}}
 */
export function buildProfile() {
  return {
    nif: '12345678Z',
    legalName: 'Ana Ruiz García',
    tradeName: 'Ultramarinos La Plaza',
    street: 'Calle Mayor 12',
    postalCode: '28013',
    city: 'Madrid',
    province: 'Madrid',
    country: 'ES',
    phone: '913456789',
    email: 'hola@ultramarinoslaplaza.example',
    invoicingEnabled: true
  };
}

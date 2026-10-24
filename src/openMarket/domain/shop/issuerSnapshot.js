/**
 * Values copied onto an invoice. Null when the NIF is missing or the legal
 * name trims to empty, and otherwise the plain object `ShopProfile.snapshot()`
 * returns. It does not parse the NIF.
 * @param {{nif?: string | null, legalName?: string | null, tradeName?: string | null, address?: {street?: string, postalCode?: string, city?: string, province?: string, country?: string} | null}} [profile]
 * @returns {{nif: string, legalName: string, tradeName: string | null, address: {street: string, postalCode: string, city: string, province: string, country: string}} | null}
 */
export default function issuerSnapshot({nif, legalName, tradeName, address} = {}) {
  const taxId = nif == null ? '' : String(nif).trim();
  const name = legalName == null ? '' : String(legalName).trim();
  if (taxId === '' || name === '') {
    return null;
  }
  return {
    nif: taxId,
    legalName: String(legalName),
    tradeName: tradeName || null,
    address: copyAddress(address)
  };
}

/**
 * @param {{street?: string, postalCode?: string, city?: string, province?: string, country?: string} | null | undefined} address
 * @returns {{street: string, postalCode: string, city: string, province: string, country: string}}
 */
function copyAddress(address) {
  if (!address) {
    return {street: '', postalCode: '', city: '', province: '', country: 'ES'};
  }
  return {
    street: address.street == null ? '' : address.street,
    postalCode: address.postalCode == null ? '' : address.postalCode,
    city: address.city == null ? '' : address.city,
    province: address.province == null ? '' : address.province,
    country: address.country == null ? 'ES' : address.country
  };
}

'use strict';

export const BRAND = {
  name: 'Vice Burgers',
  shortName: 'Vice',
  tagline: 'Premium Burgers & More',
  description: 'Sistema de gestión Vice Burgers',

  logo: 'icons/logo vice.png',
  logoSmall: 'icons/logo vice.png',
  favicon: 'icons/favicon.svg',

  color: '#e13a7a',
  colorDark: '#5B21B6',

  currency: 'ARS',
  currencySymbol: '$',

  defaultTicketFooter: 'Gracias por tu compra!'
};

export function getBrandLogo(className = '') {
  return `<img src="${BRAND.logo}" alt="${BRAND.name}" class="brand-logo ${className}" loading="eager">`;
}

export function getBrandLogoSvg(size = 36) {
  return `<img src="${BRAND.logoSmall}" alt="${BRAND.name}" width="${size}" height="${size}" class="brand-logo-sm" loading="eager">`;
}

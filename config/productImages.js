'use strict';

const ICON_LIST = [
  'American.png',
  'cheesebacon.png',
  'cheeseburger.png',
  'MOP.png',
  'papas fritas.png',
  'bacon haumado.png',
  'Coca-Cola 500.png',
  'Coca-Cola 500 Zero.png',
  'Lata Heineken.png',
  'Lata imperial.png',
  'Lata Santa Fe Pilsen.png',
  'logo vice.png',
  'SAMPLER.png'
];

const ALIAS_MAP = {
  'baconcheesesimple': 'cheesebacon.png',
  'baconcheesedoble': 'cheesebacon.png',
  'baconahumado': 'bacon haumado.png',
  'latasantafe': 'Lata Santa Fe Pilsen.png',
  'medallonadicional': 'logo vice.png'
};

function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function getProductImagePath(productName) {
  if (!productName) {
    return null;
  }

  const slug = normalize(productName);

  for (const filename of ICON_LIST) {
    const nameWithoutExt = filename.replace(/\.\w+$/, '');
    const iconSlug = normalize(nameWithoutExt);
    if (iconSlug === slug) {
      return `icons/${filename}`;
    }
  }

  if (ALIAS_MAP[slug]) {
    return `icons/${ALIAS_MAP[slug]}`;
  }

  for (const filename of ICON_LIST) {
    const nameWithoutExt = filename.replace(/\.\w+$/, '');
    const iconSlug = normalize(nameWithoutExt);
    if (slug.includes(iconSlug)) {
      return `icons/${filename}`;
    }
  }

  return null;
}

export { getProductImagePath };

'use strict';

import { getProductImagePath } from '../config/productImages.js';

function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 65%, 55%)`;
}

function generatePlaceholderSVG(name, bgColor) {
  const initial = name.charAt(0).toUpperCase();
  const truncatedName = name.length > 15 ? name.substring(0, 15) + '...' : name;

  const svg =
`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="${bgColor}"/>
  <text x="100" y="80" font-family="Inter,Arial,sans-serif" font-size="56" font-weight="600" fill="white" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  <text x="100" y="130" font-family="Inter,Arial,sans-serif" font-size="14" fill="rgba(255,255,255,0.85)" text-anchor="middle" dominant-baseline="middle">${truncatedName}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function getProductImage(product, categories = []) {
  if (product.image && product.image.trim() !== '') {
    return product.image;
  }

  const matchedPath = getProductImagePath(product.name);
  if (matchedPath) {
    return matchedPath;
  }

  let bgColor = null;
  if (product.categoryId && categories.length > 0) {
    const category = categories.find(c => c.id === product.categoryId);
    if (category && category.color) {
      bgColor = category.color;
    }
  }

  if (!bgColor) {
    bgColor = stringToColor(product.name || 'Product');
  }

  return generatePlaceholderSVG(product.name || 'Product', bgColor);
}

export { stringToColor, generatePlaceholderSVG, getProductImage };

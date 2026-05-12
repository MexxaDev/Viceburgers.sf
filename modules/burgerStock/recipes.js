'use strict';

export const DEFAULT_INGREDIENTS = [
  {
    id: 'bread',
    name: 'Pan de hamburguesa',
    unit: 'unidad',
    icon: 'fa-bread-slice',
    warningThreshold: 25,
    criticalThreshold: 10
  },
  {
    id: 'patty',
    name: 'Medallón de carne',
    unit: 'unidad',
    icon: 'fa-drumstick-bite',
    warningThreshold: 20,
    criticalThreshold: 8
  }
];

export const DEFAULT_RECIPES = [
  {
    namePattern: 'Cheeseburger Simple',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 1 }
    ]
  },
  {
    namePattern: 'Cheeseburger Doble',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 2 }
    ]
  },
  {
    namePattern: 'American Simple',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 1 }
    ]
  },
  {
    namePattern: 'American Doble',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 2 }
    ]
  },
  {
    namePattern: 'MOP Simple',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 1 }
    ]
  },
  {
    namePattern: 'MOP Doble',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 2 }
    ]
  },
  {
    namePattern: 'Bacon Cheese Simple',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 1 }
    ]
  },
  {
    namePattern: 'Bacon Cheese Doble',
    ingredients: [
      { id: 'bread', qty: 1 },
      { id: 'patty', qty: 2 }
    ]
  },
  {
    namePattern: 'Sampler Vice',
    ingredients: [
      { id: 'bread', qty: 3 },
      { id: 'patty', qty: 3 }
    ]
  },
  { namePattern: 'Medallon adicional', ingredients: [{ id: 'patty', qty: 1 }] }
];

export function findRecipe(productName, recipes) {
  if (!productName) {
    return null;
  }
  const normalized = productName.toLowerCase().trim();
  return recipes.find(r => normalized.includes(r.namePattern.toLowerCase())) || null;
}

export function getIngredientInfo(ingredientId, ingredients) {
  return ingredients.find(i => i.id === ingredientId) || null;
}

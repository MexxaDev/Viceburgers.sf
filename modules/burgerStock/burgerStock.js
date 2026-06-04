'use strict';

import state from '../../js/state.js';
import {
  burgerIngredientRepo,
  burgerRecipeRepo,
  burgerMovementRepo,
  burgerSessionRepo
} from '../../db/repositories.js';
import burgerStockService from './burgerStockService.js';
import burgerStockUI from './burgerStockUI.js';
import { DEFAULT_INGREDIENTS, DEFAULT_RECIPES } from './recipes.js';

class BurgerStock {
  constructor() {
    this.initialized = false;
  }

  async load() {
    if (!this.initialized) {
      await this._seedDefaults();
      await burgerStockService.init();
      await burgerStockService.getOrCreateTodaysSession();
      this._subscribeToEvents();
      this.initialized = true;
    } else {
      await burgerStockService.getOrCreateTodaysSession();
    }

    const container = document.getElementById('burger-stock-container');
    burgerStockUI.render(container);
  }

  async _seedDefaults() {
    const existingIngredients = await burgerIngredientRepo.findAll();
    if (existingIngredients.length === 0) {
      for (const ing of DEFAULT_INGREDIENTS) {
        await burgerIngredientRepo.create({ ...ing });
      }
    }

    const existingRecipes = await burgerRecipeRepo.findAll();
    if (existingRecipes.length === 0) {
      for (const recipe of DEFAULT_RECIPES) {
        await burgerRecipeRepo.create({
          id: `recipe_${recipe.namePattern.toLowerCase().replace(/\s+/g, '_')}`,
          namePattern: recipe.namePattern,
          active: true,
          ingredients: recipe.ingredients
        });
      }
    }
  }

  _subscribeToEvents() {
    state.on('state:sale:created', sale => {
      burgerStockService.handleSaleCreated(sale);
    });

    state.on('state:burger:stock:updated', () => {
      const container = document.getElementById('burger-stock-container');
      if (container && burgerStockService.session) {
        burgerStockUI.render(container);
      }
    });
  }
}

export default new BurgerStock();

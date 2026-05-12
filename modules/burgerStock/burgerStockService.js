'use strict';

import {
  burgerMovementRepo,
  burgerSessionRepo,
  burgerRecipeRepo,
  burgerIngredientRepo
} from '../../db/repositories.js';
import { findRecipe, getIngredientInfo } from './recipes.js';
import Notification from '../../components/notification.js';
import { logger } from '../../utils/logger.js';
import state from '../../js/state.js';

let idCounter = 0;
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const counter = (++idCounter % 1000).toString(36).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 7);
  return `${timestamp}_${counter}${random}`;
};

class BurgerStockService {
  constructor() {
    this.session = null;
    this.recipes = [];
    this.ingredients = [];
    this.processingQueue = [];
    this.isProcessing = false;
    this.processedSaleIds = new Set();
    this.recentMovements = [];
  }

  async init() {
    await this._loadIngredients();
    await this._loadRecipes();
  }

  async _loadIngredients() {
    this.ingredients = await burgerIngredientRepo.findAll();
  }

  async _loadRecipes() {
    this.recipes = await burgerRecipeRepo.findAll();
  }

  async getOrCreateTodaysSession() {
    if (this.session && this.session.status === 'open') {
      return this.session;
    }

    const today = new Date().toISOString().split('T')[0];
    const all = await burgerSessionRepo.findAll();
    const open = all.find(s => s.status === 'open' && s.date === today);
    if (open) {
      this.session = open;
      this.session.currentStock = await this._recalculateStock();
      return this.session;
    }

    this.session = null;
    return null;
  }

  async openSession(breadCount, pattyCount) {
    const today = new Date().toISOString().split('T')[0];
    const session = {
      id: generateId(),
      openedAt: new Date().toISOString(),
      date: today,
      closedAt: null,
      openingStock: { bread: breadCount, patty: pattyCount },
      currentStock: { bread: breadCount, patty: pattyCount },
      totalBreadsConsumed: 0,
      totalPattiesConsumed: 0,
      status: 'open'
    };
    this.session = session;
    await burgerSessionRepo.create(session);
    return session;
  }

  async closeSession() {
    if (!this.session) {
      return;
    }
    this.session.closedAt = new Date().toISOString();
    this.session.status = 'closed';
    this.session.currentStock = await this._recalculateStock();
    await burgerSessionRepo.update(this.session);
    this.session = null;
  }

  async adjustStock(ingredientId, delta, reason) {
    if (!this.session) {
      return;
    }
    const movement = {
      id: generateId(),
      sessionId: this.session.id,
      saleId: null,
      productId: null,
      productName: `Ajuste manual: ${reason}`,
      ingredientId,
      delta,
      action: 'manual_adjustment',
      timestamp: new Date().toISOString(),
      idempotencyKey: `manual_${generateId()}`,
      metadata: { reason }
    };
    await burgerMovementRepo.create(movement);
    this.session.currentStock = await this._recalculateStock();
    await burgerSessionRepo.update(this.session);
    this._emitUpdate();
  }

  async handleSaleCreated(sale) {
    if (!this.session || this.session.status !== 'open') {
      return;
    }
    this.processingQueue.push(sale);
    if (!this.isProcessing) {
      await this._processQueue();
    }
  }

  async _processQueue() {
    this.isProcessing = true;
    while (this.processingQueue.length > 0) {
      const sale = this.processingQueue.shift();
      if (this.processedSaleIds.has(sale.id)) {
        continue;
      }
      try {
        await this._processSale(sale);
        this.processedSaleIds.add(sale.id);
      } catch (error) {
        logger.error('BurgerStock', 'Error processing sale', { saleId: sale.id, error });
      }
    }
    this.isProcessing = false;
  }

  async _processSale(sale) {
    let sessionUpdated = false;

    for (const item of sale.items || []) {
      const recipe = findRecipe(item.name, this.recipes);
      if (!recipe) {
        continue;
      }

      for (const ing of recipe.ingredients) {
        const totalQty = ing.qty * (item.quantity || 1);

        const existing = await burgerMovementRepo.query(
          'idempotencyKey',
          `sale_${sale.id}_${item.productId}_${ing.id}`
        );
        if (existing.length > 0) {
          continue;
        }

        const movement = {
          id: generateId(),
          sessionId: this.session.id,
          saleId: sale.id,
          productId: item.productId,
          productName: item.name,
          ingredientId: ing.id,
          delta: -totalQty,
          action: 'sale',
          timestamp: new Date().toISOString(),
          idempotencyKey: `sale_${sale.id}_${item.productId}_${ing.id}`,
          metadata: {}
        };

        await burgerMovementRepo.create(movement);
        sessionUpdated = true;

        this.recentMovements.unshift(movement);
        if (this.recentMovements.length > 100) {
          this.recentMovements.pop();
        }
      }
    }

    if (sessionUpdated) {
      this.session.currentStock = await this._recalculateStock();
      this.session.totalBreadsConsumed = await this._getTotalConsumed('bread');
      this.session.totalPattiesConsumed = await this._getTotalConsumed('patty');
      await burgerSessionRepo.update(this.session);
      await this._checkThresholds();
      this._emitUpdate();
    }
  }

  async _recalculateStock() {
    if (!this.session) {
      return {};
    }
    const movements = await burgerMovementRepo.query('sessionId', this.session.id);
    const stock = { ...this.session.openingStock };
    for (const m of movements) {
      if (stock[m.ingredientId] !== undefined) {
        stock[m.ingredientId] += m.delta;
      }
    }
    return stock;
  }

  async _getTotalConsumed(ingredientId) {
    if (!this.session) {
      return 0;
    }
    const movements = await burgerMovementRepo.query('sessionId', this.session.id);
    return movements
      .filter(m => m.ingredientId === ingredientId && m.action === 'sale')
      .reduce((sum, m) => sum + Math.abs(m.delta), 0);
  }

  async _checkThresholds() {
    for (const [ingredientId, current] of Object.entries(this.session.currentStock)) {
      const ingredient = this.ingredients.find(i => i.id === ingredientId);
      if (!ingredient) {
        continue;
      }

      if (current <= ingredient.criticalThreshold) {
        await Notification.create({
          title: `⚠️ ${ingredient.name} CRÍTICO`,
          message: `Quedan ${current} ${ingredient.unit}(s). Reponer urgente.`,
          type: 'error'
        });
      } else if (current <= ingredient.warningThreshold) {
        await Notification.create({
          title: `⚠️ ${ingredient.name} bajo`,
          message: `Quedan ${current} ${ingredient.unit}(s). Considerar reposición.`,
          type: 'warning'
        });
      }
    }
  }

  async getRecentMovements(limit = 50) {
    if (!this.session) {
      return [];
    }
    const all = await burgerMovementRepo.query('sessionId', this.session.id);
    return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  async getProductRanking() {
    if (!this.session) {
      return [];
    }
    const movements = await burgerMovementRepo.query('sessionId', this.session.id);
    const saleMovements = movements.filter(m => m.action === 'sale');
    const ranking = {};
    for (const m of saleMovements) {
      const key = m.productName || 'Unknown';
      if (!ranking[key]) {
        ranking[key] = { name: key, breads: 0, patties: 0, count: 0 };
      }
      if (m.ingredientId === 'bread') {
        ranking[key].breads += Math.abs(m.delta);
      }
      if (m.ingredientId === 'patty') {
        ranking[key].patties += Math.abs(m.delta);
      }
      ranking[key].count += 1;
    }
    return Object.values(ranking).sort((a, b) => b.count - a.count);
  }

  _emitUpdate() {
    state.set('burger:stock:updated', {
      session: this.session,
      recentMovements: this.recentMovements.slice(0, 50)
    });
  }

  getStockLevel(ingredientId) {
    if (!this.session || !this.session.currentStock) {
      return 0;
    }
    return this.session.currentStock[ingredientId] || 0;
  }

  getIngredientThresholdState(ingredientId) {
    const current = this.getStockLevel(ingredientId);
    const ingredient = this.ingredients.find(i => i.id === ingredientId);
    if (!ingredient) {
      return 'normal';
    }
    if (current <= ingredient.criticalThreshold) {
      return 'critical';
    }
    if (current <= ingredient.warningThreshold) {
      return 'warning';
    }
    return 'normal';
  }
}

export default new BurgerStockService();

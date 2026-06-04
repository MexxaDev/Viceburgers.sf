'use strict';

import { settingRepo } from '../../db/repositories.js';
import { logger } from '../../utils/logger.js';
import { BRAND } from '../../config/brandConfig.js';

var SEP = '=';
var BULLET = '\u2022';

class ShopWhatsApp {
  async buildMessage(data, items, settings) {
    var businessName = settings.businessName || BRAND.name;
    var whatsappNumber = settings.shop_whatsapp || '';

    if (!whatsappNumber) {
      throw new Error('No se configuro el numero de WhatsApp');
    }

    var line = '';
    for (var l = 0; l < 30; l++) {
      line += SEP;
    }

    var msg = '';
    msg += '*NUEVO PEDIDO \u2014 ' + businessName.toUpperCase() + '*\n';
    msg += line + '\n\n';

    msg += '*Cliente:*\n' + data.firstName + ' ' + data.lastName + '\n';
    msg += '*Tel\u00E9fono:* ' + data.phone + '\n';
    msg += '*Tipo:* ' + (data.orderType === 'delivery' ? 'Delivery' : 'Take Away') + '\n\n';

    if (data.orderType === 'delivery') {
      msg += '*Direcci\u00F3n de Entrega:*\n';
      msg += data.address + '\n';
      if (data.neighborhood) {
        msg += 'Barrio: ' + data.neighborhood + '\n';
      }
      if (data.addressRef) {
        msg += 'Ref: ' + data.addressRef + '\n';
      }
      msg += '\n';
    }

    msg += '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n';
    msg += '*PEDIDO:*\n';

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var total = item.price * item.quantity;
      msg += BULLET + ' ' + item.name + ' x' + item.quantity + ' \u2014 ' + this._formatPrice(total) + '\n';
      if (item.note) {
        msg += '  _Nota: ' + item.note + '_\n';
      }
    }

    var subtotal = items.reduce(function (t, i) {
      return t + i.price * i.quantity;
    }, 0);
    msg += '\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\n';
    msg += '*SUBTOTAL:* ' + this._formatPrice(subtotal) + '\n\n';

    if (data.generalNote) {
      msg += '*Observaciones:*\n' + data.generalNote + '\n\n';
    }

    msg += line + '\n';
    msg += '*TOTAL: ' + this._formatPrice(subtotal) + '*\n';
    msg += line + '\n\n';
    msg += 'Gracias por elegir ' + businessName + ' \u263A';

    return {
      message: msg,
      whatsappNumber: whatsappNumber
    };
  }

  _formatPrice(price) {
    return '$' + price.toLocaleString('es-AR');
  }

  openWhatsApp(messageText, phoneNumber) {
    var encodedMessage = encodeURIComponent(messageText);
    var cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
    var url = 'https://wa.me/' + cleanNumber + '?text=' + encodedMessage;
    window.open(url, '_blank');
  }

  async sendOrder(data, items) {
    try {
      var settings = await this.getSettings();
      var result = await this.buildMessage(data, items, settings);
      this.openWhatsApp(result.message, result.whatsappNumber);
      return true;
    } catch (error) {
      logger.error('ShopWhatsApp', 'Error sending WhatsApp', error);
      throw error;
    }
  }

  async getSettings() {
    var allSettings = await settingRepo.findAll();
    var settingsObj = {};
    allSettings.forEach(function (s) {
      settingsObj[s.key] = s.value;
    });
    return settingsObj;
  }
}

export default new ShopWhatsApp();

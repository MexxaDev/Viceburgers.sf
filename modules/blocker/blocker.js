'use strict';

class PaymentBlocker {
  activate() {
    if (document.getElementById('payment-blocker')) {
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'payment-blocker';
    overlay.className = 'payment-blocker';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'payment-blocker-title');

    overlay.innerHTML = `
      <div class="payment-blocker__modal">
        <div class="payment-blocker__icon">
          <i class="fa-solid fa-lock"></i>
        </div>
        <h2 class="payment-blocker__title" id="payment-blocker-title">Renovación de hosting pendiente</h2>
        <p class="payment-blocker__description">
          Hace 30 días no pudimos procesar el pago correspondiente a la renovación de tu servicio de hosting.
          Actualmente registrás un saldo pendiente de $30.000 ARS.
          Para evitar la suspensión del servicio y garantizar la disponibilidad de tu sitio web,
          te recomendamos regularizar el pago a la brevedad.
        </p>
        <button type="button" class="payment-blocker__cta">Regularizar pago</button>
        <p class="payment-blocker__note">
          Si el pago ya fue realizado, este aviso desaparecerá automáticamente una vez que el sistema confirme la acreditación.
        </p>
        <div class="payment-blocker__divider"></div>
        <div class="payment-blocker__support">
          <div class="payment-blocker__support-icon">
            <i class="fa-solid fa-headset"></i>
          </div>
          <div class="payment-blocker__support-text">
            <strong>¿Necesitás ayuda con tu facturación?</strong>
            <span>Nuestro equipo de soporte está disponible para asistirte de lunes a sábado de 10:00 a 19:00 hs.</span>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.querySelector('.payment-blocker__cta').addEventListener('click', () => {
      const modal = overlay.querySelector('.payment-blocker__modal');
      modal.classList.remove('shake');
      void modal.offsetWidth;
      modal.classList.add('shake');
    });

    window.addEventListener(
      'keydown',
      event => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      true
    );

    requestAnimationFrame(() => overlay.classList.add('active'));
  }
}

export default new PaymentBlocker();

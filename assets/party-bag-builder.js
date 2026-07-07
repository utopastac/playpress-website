window.addEventListener('load', () => {
  document.querySelectorAll('[is="party-bag-builder"]').forEach((builder) => {
    new PartyBagBuilder(builder);
  });
});

class PartyBagBuilder {
  constructor(root) {
    this.root = root;
    this.quantities = {};
    this.buttonText = root.dataset.buttonText ?? 'Add to Cart';
    this.discountTiers = JSON.parse(root.dataset.discountTiers ?? '[]')
      .filter((tier) => tier.minQty > 0)
      .sort((a, b) => a.minQty - b.minQty);

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.root.querySelectorAll('[data-quantity-increase]').forEach((button) => {
      button.addEventListener('click', () => this.handleQuantityChange(button, 1));
    });

    this.root.querySelectorAll('[data-quantity-decrease]').forEach((button) => {
      button.addEventListener('click', () => this.handleQuantityChange(button, -1));
    });

    const addToCartButton = this.root.querySelector('[data-add-to-cart]');
    if (addToCartButton) {
      addToCartButton.addEventListener('click', () => this.handleAddToCart());
    }
  }

  handleQuantityChange(button, change) {
    const productId = button.dataset.productId;
    const productPrice = parseFloat(button.dataset.productPrice);
    const card = button.closest('[data-product-card]');
    const display = card.querySelector('[data-quantity-display]');
    const decreaseBtn = card.querySelector('[data-quantity-decrease]');

    if (!this.quantities[productId]) {
      this.quantities[productId] = { quantity: 0, price: productPrice };
    }

    this.quantities[productId].quantity = Math.max(0, this.quantities[productId].quantity + change);
    display.textContent = this.quantities[productId].quantity;
    decreaseBtn.disabled = this.quantities[productId].quantity === 0;

    this.updateSummary();
  }

  updateSummary() {
    let totalQuantity = 0;
    let subtotal = 0;

    for (const productId in this.quantities) {
      const item = this.quantities[productId];
      totalQuantity += item.quantity;
      subtotal += item.quantity * item.price;
    }

    const currentTier = this.getCurrentTier(totalQuantity);
    const discountPercent = currentTier ? currentTier.discount : 0;
    const discountAmount = subtotal * (discountPercent / 100);
    const total = subtotal - discountAmount;

    const totalQuantityEl = this.root.querySelector('[data-total-quantity]');
    const subtotalEl = this.root.querySelector('[data-subtotal]');
    const discountAmountEl = this.root.querySelector('[data-discount-amount]');
    const totalEl = this.root.querySelector('[data-total]');
    const discountRow = this.root.querySelector('[data-discount-row]');
    const addToCartBtn = this.root.querySelector('[data-add-to-cart]');

    if (totalQuantityEl) { totalQuantityEl.textContent = totalQuantity; }
    if (subtotalEl) { subtotalEl.textContent = this.formatMoney(subtotal); }
    if (discountAmountEl) { discountAmountEl.textContent = `−${this.formatMoney(discountAmount)}`; }
    if (totalEl) { totalEl.textContent = this.formatMoney(total); }

    if (discountRow) {
      discountRow.hidden = discountAmount <= 0;
    }

    if (addToCartBtn) {
      addToCartBtn.disabled = totalQuantity === 0;
    }

    this.updateDiscountBanner(totalQuantity, discountPercent);
  }

  getCurrentTier(quantity) {
    let currentTier = null;

    for (const tier of this.discountTiers) {
      if (quantity >= tier.minQty) {
        currentTier = tier;
      }
    }

    return currentTier;
  }

  getNextTier(quantity) {
    for (const tier of this.discountTiers) {
      if (quantity < tier.minQty) {
        return tier;
      }
    }

    return null;
  }

  updateDiscountBanner(quantity, currentDiscount) {
    const currentTierEl = this.root.querySelector('[data-current-tier]');
    const nextTierEl = this.root.querySelector('[data-next-tier]');

    if (!currentTierEl || !nextTierEl) { return; }

    if (quantity === 0) {
      currentTierEl.textContent = 'Select items to see your discount';
      nextTierEl.textContent = '';
      return;
    }

    if (currentDiscount > 0) {
      currentTierEl.textContent = `You're saving ${currentDiscount}%!`;
    } else {
      currentTierEl.textContent = 'No discount yet';
    }

    const nextTier = this.getNextTier(quantity);

    if (nextTier) {
      const itemsNeeded = nextTier.minQty - quantity;
      nextTierEl.textContent = `Add ${itemsNeeded} more item${itemsNeeded !== 1 ? 's' : ''} to save ${nextTier.discount}%`;
    } else {
      nextTierEl.textContent = 'Maximum discount reached!';
    }
  }

  async handleAddToCart() {
    const items = [];

    for (const productId in this.quantities) {
      const item = this.quantities[productId];
      if (item.quantity > 0) {
        items.push({ id: productId, quantity: item.quantity });
      }
    }

    if (items.length === 0) { return; }

    const addToCartBtn = this.root.querySelector('[data-add-to-cart]');

    if (addToCartBtn) {
      addToCartBtn.disabled = true;
      addToCartBtn.textContent = 'Adding...';
    }

    try {
      const response = await fetch(this.root.dataset.cartUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      if (response.ok) {
        this.showMessage('Items added to cart successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/cart';
        }, 1000);
      } else {
        throw new Error('Failed to add items to cart');
      }
    } catch (error) {
      this.showMessage('Error adding items to cart. Please try again.', 'error');

      if (addToCartBtn) {
        addToCartBtn.disabled = false;
        addToCartBtn.textContent = this.buttonText;
      }
    }
  }

  showMessage(text, type) {
    const messageEl = this.root.querySelector('[data-message]');
    if (!messageEl) { return; }

    messageEl.textContent = text;
    messageEl.className = `party-bag-builder__message is-${type}`;
    messageEl.hidden = false;

    setTimeout(() => {
      messageEl.hidden = true;
    }, 5000);
  }

  formatMoney(cents) {
    const format = document.querySelector('[data-money-format]')?.getAttribute('data-money-format') ?? '';

    if (window.formatMoney) {
      return window.formatMoney(cents, format);
    }

    return (cents / 100).toFixed(2);
  }
}

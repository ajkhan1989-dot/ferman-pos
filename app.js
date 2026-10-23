/**
 * FERMAN POS & SEZNIK VEER 58mm BILLING APPLICATION
 * Synchronized with official website data from D:\ferman-shopify (ferman.in)
 */

// Official Products Catalog synced directly from D:\ferman-shopify\src\data\products.ts
const DEFAULT_PRODUCTS = [
  // --- RAW CRAFT KOMBUCHAS (21-Day Slow Fermented) ---
  {
    id: 'mango-unchained',
    name: 'Mango Unchained',
    category: 'kombucha',
    price: 200,
    tag: 'Real Mango Meets Fermented Assam Tea',
    badge: 'bestseller',
    badgeText: 'BEST SELLER',
    heat: '🍊 Tang 5/5 • 🫧 Fizz 5/5',
    image: 'assets/mango-kom-bottle.webp'
  },
  {
    id: 'berry-potter',
    name: 'Berry Potter',
    category: 'kombucha',
    price: 200,
    tag: 'Crisp Apple, Tart Cranberry & Assam Tea',
    badge: 'popular',
    badgeText: 'POPULAR',
    heat: '🍊 Tang 3/5 • 🫧 Fizz 4/5',
    image: 'assets/berry-kom-bottle.webp'
  },
  {
    id: 'tropical-thunder',
    name: 'Tropical Thunder',
    category: 'kombucha',
    price: 200,
    tag: 'Real Tropical Fruits, Mango & Banana Pulp',
    heat: '🍊 Tang 5/5 • 🫧 Fizz 5/5',
    image: 'assets/tropical-kom-bottle.webp'
  },
  {
    id: 'pomegrenade',
    name: 'Pomegrenade',
    category: 'kombucha',
    price: 200,
    tag: 'Ruby Pomegranate, Crisp Apple & Assam Tea',
    heat: '🍊 Tang 4/5 • 🫧 Fizz 4/5',
    image: 'assets/pomegrenade-kom-bottle.webp'
  },

  // --- FIERY GINGER BEERS (Wild Ginger Bug Fermentation) ---
  {
    id: 'the-real-heat',
    name: 'Ginger Original',
    category: 'ginger',
    price: 200,
    tag: 'The Real Heat • Wild Ginger Bug Fermentation',
    badge: 'bestseller',
    badgeText: 'BEST SELLER',
    heat: '🔥🔥🔥🔥🔥 Heat 5/5',
    image: 'assets/ginger-bottle.webp'
  },
  {
    id: 'ginger-mango',
    name: 'Ginger Mango',
    category: 'ginger',
    price: 200,
    tag: 'Real Mango Pulp & Wild Ginger Bug',
    heat: '🔥🔥🔥🔥 Heat 4/5',
    image: 'assets/ginger-mango-bottle.webp'
  },
  {
    id: 'ginger-cranberry',
    name: 'Ginger Cranberry',
    category: 'ginger',
    price: 200,
    tag: 'Crisp Apple, Tart Cranberry & Ginger Bug',
    heat: '🔥🔥🔥🔥 Heat 4/5',
    image: 'assets/ginger-cranberry-bottle.webp'
  },
  {
    id: 'ginger-pink-guava',
    name: 'Ginger Pink Guava',
    category: 'ginger',
    price: 200,
    tag: 'Tropical Guava Pulp & Wild Ginger Bug',
    badge: 'popular',
    badgeText: 'POPULAR',
    heat: '🔥🔥🔥🔥🔥 Heat 5/5',
    image: 'assets/ginger-guava-bottle.webp'
  }
];

// App State
class PosApp {
  constructor() {
    this.products = [...DEFAULT_PRODUCTS];
    this.cart = [];
    this.currentCategory = 'all';
    this.searchQuery = '';
    this.paymentMethod = 'cash';
    this.discountPercent = 0;
    this.taxPercent = 5;
    this.cashTendered = 0;
    this.soundEnabled = true;
    this.audioCtx = null;
    this.orderSeq = parseInt(localStorage.getItem('ferman_order_seq') || '1001', 10);
    this.ordersHistory = JSON.parse(localStorage.getItem('ferman_orders_history') || '[]');
    
    // Store Settings synced with D:\ferman-shopify
    const storedSettings = localStorage.getItem('ferman_store_settings_v5');
    if (storedSettings) {
      this.storeSettings = JSON.parse(storedSettings);
    } else {
      this.storeSettings = {
        name: 'Ferman Craft Fermentation Co.',
        tagline: 'Live, Small-Batch Kombucha & Ginger Beer',
        phone: '+91 98999 52525',
        email: 'orders@ferman.in',
        footerMessage: 'Keep Refrigerated 2°C - 6°C',
        fssai: '13326003000277',
        gstin: '07BNPPK0957B2ZZ'
      };
      localStorage.setItem('ferman_store_settings_v5', JSON.stringify(this.storeSettings));
    }

    this.init();
  }

  init() {
    this.renderProducts();
    this.updateCartUi();
    this.updateOrderSeqDisplay();
    this.initEventListeners();
    this.initPrinterListeners();
    this.renderHistory();
    this.syncSettingsInputs();
  }

  /* -------------------------------------------------------------
   * AUDIO FEEDBACK (Web Audio API Synthesizer)
   * ----------------------------------------------------------- */
  playSound(type = 'click') {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      const now = this.audioCtx.currentTime;

      if (type === 'click') {
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'cash') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      // Audio not permitted
    }
  }

  /* -------------------------------------------------------------
   * PRINTER HARDWARE LISTENERS
   * ----------------------------------------------------------- */
  initPrinterListeners() {
    window.SeznikPrinter.onStatusChange((info) => {
      const dot = document.getElementById('printer-status-dot');
      const text = document.getElementById('printer-status-text');
      const infoBox = document.getElementById('settings-printer-info');

      if (!dot || !text) return;

      dot.className = 'status-dot';
      if (info.status === 'connected') {
        dot.classList.add('connected');
        text.textContent = `Veer: Connected (${info.type.toUpperCase()})`;
        if (infoBox) {
          infoBox.innerHTML = `<strong>Connected to:</strong> ${info.deviceName}<br><strong>Mode:</strong> ${info.type.toUpperCase()} Direct ESC/POS<br><strong>Status:</strong> Online & Ready to Print 58mm`;
        }
      } else if (info.status === 'connecting') {
        dot.classList.add('connecting');
        text.textContent = info.details?.message || 'Connecting...';
      } else if (info.status === 'error') {
        dot.classList.add('error');
        text.textContent = 'Veer: Error';
        alert(`SEZNIK Veer Printer Note: ${info.message || 'Connection failed'}`);
      } else {
        text.textContent = 'Veer: Disconnected';
        if (infoBox) {
          infoBox.innerHTML = `Status: Disconnected<br>Protocol: ESC/POS (58mm / 384 dots per line)<br>Ready to pair via Bluetooth or USB.`;
        }
      }
    });
  }

  /* -------------------------------------------------------------
   * PRODUCTS CATALOG RENDERING & FILTERING
   * ----------------------------------------------------------- */
  renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    const filtered = this.products.filter(p => {
      const matchCat = this.currentCategory === 'all' || p.category === this.currentCategory;
      const q = this.searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.name.toLowerCase().includes(q) || (p.tag && p.tag.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          <div style="font-size: 2rem; margin-bottom: 8px;">🔍</div>
          <p>No drinks found matching "<strong>${this.searchQuery}</strong>"</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(item => `
      <div class="product-card" data-id="${item.id}">
        ${item.badge ? `<span class="product-badge ${item.badge}">${item.badgeText}</span>` : ''}
        <div class="product-img-box">
          <img src="${item.image}" alt="${item.name}" class="product-img" onerror="this.src='assets/ginger-bottle.webp'">
        </div>
        <div class="product-info">
          <div class="product-name">${item.name}</div>
          <div class="product-tag">${item.tag || ''}</div>
          <div class="product-footer">
            <div>
              <span class="product-price">₹${item.price}</span>
              ${item.mrp ? `<span style="font-size: 0.72rem; color: #94A3B8; text-decoration: line-through; margin-left: 4px;">₹${item.mrp}</span>` : ''}
            </div>
            <button class="product-add-btn" title="Add to bill">+</button>
          </div>
        </div>
      </div>
    `).join('');
  }

  /* -------------------------------------------------------------
   * CART LOGIC & OPERATIONS
   * ----------------------------------------------------------- */
  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(c => c.id === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      });
    }

    this.playSound('click');
    this.updateCartUi();
  }

  updateQuantity(productId, delta) {
    const item = this.cart.find(c => c.id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      this.cart = this.cart.filter(c => c.id !== productId);
    }
    this.playSound('click');
    this.updateCartUi();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(c => c.id !== productId);
    this.playSound('click');
    this.updateCartUi();
  }

  clearCart() {
    if (this.cart.length === 0) return;
    this.cart = [];
    this.cashTendered = 0;
    const tenderedInput = document.getElementById('cash-tendered-input');
    if (tenderedInput) tenderedInput.value = '';
    this.playSound('click');
    this.updateCartUi();
  }

  getCalculations() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalQuantity = this.cart.reduce((sum, item) => sum + item.quantity, 0);

    const discountAmount = (subtotal * this.discountPercent) / 100;
    const finalPayable = Math.max(0, subtotal - discountAmount);

    // 5% GST is INCLUDED in the MRP
    // Formula: Taxable Base = Total / 1.05
    const taxableAmount = finalPayable > 0 ? (finalPayable / 1.05) : 0;
    const taxAmount = finalPayable - taxableAmount;
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;
    const grandTotal = Math.round(finalPayable);

    return {
      subtotal,
      totalQuantity,
      discountAmount,
      taxableAmount,
      taxPercent: 5,
      taxAmount,
      cgstAmount,
      sgstAmount,
      grandTotal
    };
  }

  updateCartUi() {
    const wrapper = document.getElementById('cart-items-wrapper');
    const subtotalEl = document.getElementById('summary-subtotal');
    const totalQtyEl = document.getElementById('summary-total-qty');
    const grandTotalEl = document.getElementById('summary-grand-total');
    const discountRow = document.getElementById('summary-discount-row');
    const discountPctEl = document.getElementById('summary-discount-pct');
    const discountValEl = document.getElementById('summary-discount-val');
    const taxRow = document.getElementById('summary-tax-row');
    const taxValEl = document.getElementById('summary-tax-val');
    const changeDisplay = document.getElementById('cash-change-display');

    const calcs = this.getCalculations();

    // Render items
    if (this.cart.length === 0) {
      wrapper.innerHTML = `
        <div class="empty-cart-state" id="empty-cart-state">
          <div class="empty-cart-icon">🛒</div>
          <p><strong>Your cart is empty</strong></p>
          <p>Tap any drink on the left to start billing</p>
        </div>
      `;
    } else {
      wrapper.innerHTML = this.cart.map(item => `
        <div class="cart-item-row" data-id="${item.id}">
          <div class="cart-item-details">
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price-each">₹${item.price} each (Incl. 5% GST)</div>
          </div>
          <div class="cart-item-qty-controls">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">-</button>
            <span class="qty-count">${item.quantity}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
          <div class="cart-item-total">₹${item.price * item.quantity}</div>
          <button class="btn-remove-item" data-id="${item.id}" title="Remove item">✕</button>
        </div>
      `).join('');
    }

    // Totals
    totalQtyEl.textContent = calcs.totalQuantity;
    subtotalEl.textContent = `₹${calcs.subtotal.toFixed(2)}`;
    grandTotalEl.textContent = `₹${calcs.grandTotal.toFixed(0)}`;

    if (calcs.discountAmount > 0) {
      discountRow.style.display = 'flex';
      discountPctEl.textContent = this.discountPercent;
      discountValEl.textContent = `-₹${calcs.discountAmount.toFixed(2)}`;
    } else {
      discountRow.style.display = 'none';
    }

    // 5% GST is always included in the MRP
    if (taxRow && taxValEl) {
      taxRow.style.display = 'flex';
      taxValEl.textContent = `₹${calcs.taxAmount.toFixed(2)} (CGST ₹${calcs.cgstAmount.toFixed(2)} + SGST ₹${calcs.sgstAmount.toFixed(2)})`;
    }

    // Change Calculation for Cash
    if (changeDisplay) {
      const tendered = parseFloat(document.getElementById('cash-tendered-input')?.value || '0');
      const change = Math.max(0, tendered - calcs.grandTotal);
      changeDisplay.textContent = `Change: ₹${change.toFixed(0)}`;
    }

    // Update Mobile Cart Badge and Floating Bar
    const mobileBadge = document.getElementById('mobile-cart-badge');
    const mobileFloatingBar = document.getElementById('mobile-floating-cart-bar');
    const mobileFloatingCount = document.getElementById('mobile-floating-count');
    const mobileFloatingTotal = document.getElementById('mobile-floating-total');

    if (mobileBadge) {
      mobileBadge.textContent = calcs.totalQuantity;
      mobileBadge.style.display = calcs.totalQuantity > 0 ? 'inline-flex' : 'none';
    }

    if (mobileFloatingBar) {
      if (calcs.totalQuantity > 0) {
        mobileFloatingBar.classList.add('visible');
        if (mobileFloatingCount) {
          mobileFloatingCount.textContent = `${calcs.totalQuantity} Bottle${calcs.totalQuantity > 1 ? 's' : ''}`;
        }
        if (mobileFloatingTotal) {
          mobileFloatingTotal.textContent = `₹${calcs.grandTotal.toFixed(0)}`;
        }
      } else {
        mobileFloatingBar.classList.remove('visible');
      }
    }
  }

  updateOrderSeqDisplay() {
    const el = document.getElementById('display-order-id');
    if (el) el.textContent = `#FRM-${this.orderSeq}`;
  }

  /* -------------------------------------------------------------
   * ORDER DATA BUILDER
   * ----------------------------------------------------------- */
  buildOrderData() {
    const calcs = this.getCalculations();
    const now = new Date();
    const custName = document.getElementById('cust-name-input')?.value.trim() || '';
    const custPhone = document.getElementById('cust-phone-input')?.value.trim() || '';

    return {
      orderId: `FRM-${this.orderSeq}`,
      timestamp: now.toISOString(),
      dateFormatted: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      timeFormatted: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      customerName: custName,
      customerPhone: custPhone,
      items: [...this.cart],
      totalQuantity: calcs.totalQuantity,
      subtotal: calcs.subtotal,
      discountPercent: this.discountPercent,
      discountAmount: calcs.discountAmount,
      taxPercent: 5,
      taxableAmount: calcs.taxableAmount,
      taxAmount: calcs.taxAmount,
      cgstAmount: calcs.cgstAmount,
      sgstAmount: calcs.sgstAmount,
      grandTotal: calcs.grandTotal,
      paymentMethod: this.paymentMethod,
      cashTendered: parseFloat(document.getElementById('cash-tendered-input')?.value || '0')
    };
  }

  /* -------------------------------------------------------------
   * PRINT TO SEZNIK VEER (PRIMARY ACTION)
   * ----------------------------------------------------------- */
  async handlePrintSeznik() {
    if (this.cart.length === 0) {
      alert('Your cart is empty! Add drinks before printing a bill.');
      this.playSound('error');
      return;
    }

    const orderData = this.buildOrderData();

    if (window.SeznikPrinter.isConnected) {
      try {
        const buffer = window.SeznikPrinter.buildReceiptCommands(orderData, this.storeSettings);
        await window.SeznikPrinter.printEscPos(buffer);
        this.playSound('cash');
        this.completeOrder(orderData);
      } catch (err) {
        console.error('Print failed:', err);
        alert(`Printer Error: ${err.message}. Falling back to 58mm System Print.`);
        this.handleSystemPrint(orderData);
      }
    } else {
      const choice = confirm(
        `SEZNIK Veer is not directly connected.\n\n` +
        `Click "OK" to connect SEZNIK Veer via Bluetooth now,\n` +
        `or "Cancel" to print using standard 58mm Browser Spooler.`
      );

      if (choice) {
        try {
          await window.SeznikPrinter.connectBluetooth();
          const buffer = window.SeznikPrinter.buildReceiptCommands(orderData, this.storeSettings);
          await window.SeznikPrinter.printEscPos(buffer);
          this.playSound('cash');
          this.completeOrder(orderData);
        } catch (e) {
          console.warn('Bluetooth connection cancelled or failed:', e);
        }
      } else {
        this.handleSystemPrint(orderData);
      }
    }
  }

  /* -------------------------------------------------------------
   * BROWSER SYSTEM PRINT (58mm Exact Spooler)
   * ----------------------------------------------------------- */
  handleSystemPrint(prebuiltOrderData = null) {
    if (this.cart.length === 0 && !prebuiltOrderData) {
      alert('Your cart is empty!');
      return;
    }

    const order = prebuiltOrderData || this.buildOrderData();
    this.populatePrintableTicket(order);
    this.playSound('cash');
    window.print();
    if (!prebuiltOrderData) {
      this.completeOrder(order);
    }
  }

  populatePrintableTicket(order) {
    const container = document.getElementById('printable-thermal-ticket');
    if (!container) return;

    let itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 2px 0;">${item.name}</td>
        <td style="text-align: right;">${item.quantity}</td>
        <td style="text-align: right;">₹${item.price}</td>
        <td style="text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div class="ticket-center">
        <div class="ticket-title" style="line-height: 1.15; font-size: 14px; font-weight: 900;">FERMAN CRAFT<br>FERMENTATION CO.</div>
        <div style="font-size: 10px; margin-top: 2px;">Live, Small-Batch Kombucha<br>&amp; Ginger Beer</div>
        <div style="font-size: 9px; margin-top: 2px;">Ph: ${this.storeSettings.phone || '+91 98999 52525'}</div>
        <div style="font-size: 8px;">FSSAI: ${this.storeSettings.fssai || '13326003000277'}</div>
        <div style="font-size: 8px;">GSTIN: 07BNPPK0957B2ZZ</div>
      </div>

      <div class="ticket-double-divider"></div>

      <div class="ticket-row" style="font-size: 9px;">
        <span>Bill: <strong>#${order.orderId}</strong></span>
        <span>${order.dateFormatted}</span>
      </div>
      <div class="ticket-row" style="font-size: 9px;">
        <span>Pay: <strong>${order.paymentMethod.toUpperCase()}</strong></span>
        <span>${order.timeFormatted}</span>
      </div>
      ${order.customerName ? `<div style="font-size: 9px;">Cust: ${order.customerName}</div>` : ''}
      ${order.customerPhone ? `<div style="font-size: 9px;">Phone: ${order.customerPhone}</div>` : ''}

      <div class="ticket-divider"></div>

      <table class="ticket-table">
        <thead>
          <tr style="border-bottom: 1px dashed #000;">
            <th>ITEM</th>
            <th style="text-align: right;">QTY</th>
            <th style="text-align: right;">RATE</th>
            <th style="text-align: right;">AMT</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="ticket-divider"></div>

      <div class="ticket-row" style="font-size: 10px;">
        <span>Subtotal (MRP):</span>
        <span>₹${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.discountAmount > 0 ? `
        <div class="ticket-row" style="font-size: 10px;">
          <span>Discount (${order.discountPercent}%):</span>
          <span>-₹${order.discountAmount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="ticket-row" style="font-size: 9px; color: #333;">
        <span>Net Taxable Base:</span>
        <span>₹${(order.taxableAmount || (order.grandTotal / 1.05)).toFixed(2)}</span>
      </div>
      <div class="ticket-row" style="font-size: 9px; color: #333;">
        <span>CGST (2.5%):</span>
        <span>₹${(order.cgstAmount || (order.taxAmount / 2)).toFixed(2)}</span>
      </div>
      <div class="ticket-row" style="font-size: 9px; color: #333;">
        <span>SGST (2.5%):</span>
        <span>₹${(order.sgstAmount || (order.taxAmount / 2)).toFixed(2)}</span>
      </div>
      <div class="ticket-row" style="font-size: 9px; font-weight: bold;">
        <span>Total 5% GST (Incl):</span>
        <span>₹${order.taxAmount.toFixed(2)}</span>
      </div>

      <div class="ticket-double-divider"></div>

      <div class="ticket-row ticket-total">
        <span>TOTAL (INCL GST):</span>
        <span>₹${order.grandTotal.toFixed(0)}</span>
      </div>

      <div class="ticket-double-divider"></div>

      <div class="ticket-row" style="font-size: 9px;">
        <span>Total Bottles:</span>
        <span>${order.totalQuantity}</span>
      </div>

      <div class="ticket-center" style="margin-top: 8px; font-size: 9px; line-height: 1.35;">
        <div>Keep Refrigerated 2°C - 6°C</div>
        <div style="font-weight: 600;">Instagram: @ferman.in</div>
      </div>
    `;
  }

  /* -------------------------------------------------------------
   * WHATSAPP DIGITAL RECEIPT SHARING
   * ----------------------------------------------------------- */
  shareOnWhatsApp() {
    if (this.cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const order = this.buildOrderData();
    let msg = `🌿 *${this.storeSettings.name}*\n`;
    if (this.storeSettings.tagline) msg += `_${this.storeSettings.tagline}_\n`;
    msg += `🧾 *Receipt #${order.orderId}*\n`;
    msg += `📅 ${order.dateFormatted} • ${order.timeFormatted}\n`;
    msg += `💳 Paid via: *${order.paymentMethod.toUpperCase()}*\n`;
    msg += `--------------------------------\n`;

    order.items.forEach(item => {
      msg += `• *${item.quantity}x* ${item.name} = ₹${item.price * item.quantity}\n`;
    });

    msg += `--------------------------------\n`;
    msg += `Subtotal (MRP): ₹${order.subtotal.toFixed(0)}\n`;
    if (order.discountAmount > 0) msg += `Discount (${order.discountPercent}%): -₹${order.discountAmount.toFixed(0)}\n`;
    msg += `*Grand Total: ₹${order.grandTotal.toFixed(0)}*\n`;
    msg += `_(Inclusive of 5% GST: ₹${order.taxAmount.toFixed(2)})_\n`;
    msg += `--------------------------------\n`;
    msg += `Keep Chilled at 2°C - 6°C • Never Pasteurised\n`;
    msg += `FSSAI Lic: ${this.storeSettings.fssai}\n`;
    msg += `GSTIN: 07BNPPK0957B2ZZ\n`;
    msg += `Instagram: @ferman.in • Website: ferman.in`;

    let url = `https://wa.me/`;
    if (order.customerPhone) {
      const cleanPhone = order.customerPhone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      url += `${fullPhone}`;
    }
    url += `?text=${encodeURIComponent(msg)}`;

    window.open(url, '_blank');
  }

  /* -------------------------------------------------------------
   * DYNAMIC UPI QR SCAN-AND-PAY
   * ----------------------------------------------------------- */
  openUpiModal() {
    if (this.cart.length === 0) {
      alert('Add items to cart first!');
      return;
    }

    const calcs = this.getCalculations();
    const modal = document.getElementById('modal-upi');
    const qrContainer = document.getElementById('qrcode-container');
    const amountDisplay = document.getElementById('upi-display-amount');

    amountDisplay.textContent = `₹${calcs.grandTotal.toFixed(0)}`;
    qrContainer.innerHTML = '';

    const upiString = `upi://pay?pa=${encodeURIComponent(this.storeSettings.upiId)}&pn=${encodeURIComponent(this.storeSettings.name)}&am=${calcs.grandTotal}&cu=INR&tn=Order%20${this.orderSeq}`;

    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: upiString,
        width: 180,
        height: 180,
        colorDark: '#153222',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    }

    modal.classList.add('active');
  }

  /* -------------------------------------------------------------
   * 58mm THERMAL PREVIEW MODAL
   * ----------------------------------------------------------- */
  openThermalPreview() {
    const order = this.buildOrderData();
    const tape = document.getElementById('thermal-preview-tape');
    const modal = document.getElementById('modal-thermal-preview');
    if (!tape || !modal) return;

    let itemsHtml = order.items.map(item => `
      <div class="tape-row">
        <span>${item.name} x${item.quantity}</span>
        <span>₹${item.price * item.quantity}</span>
      </div>
    `).join('');

    tape.innerHTML = `
      <div class="tape-header">
        <div class="tape-store-name" style="line-height: 1.15;">FERMAN CRAFT<br>FERMENTATION CO.</div>
        <div style="font-size: 11px; margin-top: 2px;">Live, Small-Batch Kombucha<br>&amp; Ginger Beer</div>
        <div style="font-size: 10px; margin-top: 2px;">Ph: ${this.storeSettings.phone || '+91 98999 52525'}</div>
        <div style="font-size: 9px;">FSSAI: ${this.storeSettings.fssai || '13326003000277'}</div>
        <div style="font-size: 9px;">GSTIN: 07BNPPK0957B2ZZ</div>
      </div>

      <hr class="tape-double-divider">

      <div class="tape-row">
        <span>Bill: <strong>#${order.orderId}</strong></span>
        <span>${order.dateFormatted}</span>
      </div>
      <div class="tape-row">
        <span>Pay: <strong>${order.paymentMethod.toUpperCase()}</strong></span>
        <span>${order.timeFormatted}</span>
      </div>
      ${order.customerName ? `<div>Cust: ${order.customerName}</div>` : ''}
      ${order.customerPhone ? `<div>Phone: ${order.customerPhone}</div>` : ''}

      <hr class="tape-divider">

      ${itemsHtml || '<div class="tape-center">No items</div>'}

      <hr class="tape-divider">

      <div class="tape-row">
        <span>Subtotal (MRP):</span>
        <span>₹${order.subtotal.toFixed(2)}</span>
      </div>
      ${order.discountAmount > 0 ? `
        <div class="tape-row">
          <span>Discount (${order.discountPercent}%):</span>
          <span>-₹${order.discountAmount.toFixed(2)}</span>
        </div>
      ` : ''}
      <div class="tape-row" style="font-size: 9px; color: #555;">
        <span>Net Taxable Base:</span>
        <span>₹${(order.taxableAmount || (order.grandTotal / 1.05)).toFixed(2)}</span>
      </div>
      <div class="tape-row" style="font-size: 9px; color: #555;">
        <span>CGST 2.5% + SGST 2.5%:</span>
        <span>₹${order.taxAmount.toFixed(2)}</span>
      </div>
      <div class="tape-row" style="font-weight: 700;">
        <span>Total 5% GST (Incl):</span>
        <span>₹${order.taxAmount.toFixed(2)}</span>
      </div>

      <hr class="tape-double-divider">

      <div class="tape-grand-total">
        <span>TOTAL (INCL GST):</span>
        <span>₹${order.grandTotal.toFixed(0)}</span>
      </div>

      <hr class="tape-double-divider">

      <div class="tape-row">
        <span>Total Bottles:</span>
        <span>${order.totalQuantity}</span>
      </div>

      <div class="tape-center" style="margin-top: 10px; font-size: 10px; line-height: 1.35;">
        <div>Keep Refrigerated 2°C - 6°C</div>
        <div style="font-weight: 600;">Instagram: @ferman.in</div>
      </div>
    `;

    modal.classList.add('active');
  }

  /* -------------------------------------------------------------
   * COMPLETE ORDER & STORE TO LOCAL DATABASE
   * ----------------------------------------------------------- */
  completeOrder(orderData) {
    this.ordersHistory.unshift(orderData);
    localStorage.setItem('ferman_orders_history', JSON.stringify(this.ordersHistory));

    this.orderSeq += 1;
    localStorage.setItem('ferman_order_seq', this.orderSeq.toString());

    this.updateOrderSeqDisplay();
    this.renderHistory();

    const custName = document.getElementById('cust-name-input');
    const custPhone = document.getElementById('cust-phone-input');
    if (custName) custName.value = '';
    if (custPhone) custPhone.value = '';

    this.clearCart();
    this.switchMobilePosView('catalog');
  }

  /* -------------------------------------------------------------
   * MOBILE VIEW SWITCHER (Catalog vs Checkout on Android)
   * ----------------------------------------------------------- */
  switchMobilePosView(view) {
    const catalogPanel = document.querySelector('.pos-catalog-panel');
    const checkoutPanel = document.querySelector('.pos-checkout-panel');
    const tabCatalog = document.getElementById('tab-mobile-catalog');
    const tabCart = document.getElementById('tab-mobile-cart');

    if (view === 'cart') {
      catalogPanel?.classList.add('mobile-hidden');
      checkoutPanel?.classList.remove('mobile-hidden');
      tabCatalog?.classList.remove('active');
      tabCart?.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      catalogPanel?.classList.remove('mobile-hidden');
      checkoutPanel?.classList.add('mobile-hidden');
      tabCatalog?.classList.add('active');
      tabCart?.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /* -------------------------------------------------------------
   * SALES ANALYTICS & HISTORY TABLE RENDERING
   * ----------------------------------------------------------- */
  renderHistory() {
    const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const todayOrders = this.ordersHistory.filter(o => o.dateFormatted === todayStr);

    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    const bottlesSold = todayOrders.reduce((sum, o) => sum + (o.totalQuantity || 0), 0);
    const upiRevenue = todayOrders.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.grandTotal, 0);
    const cashRevenue = todayOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.grandTotal, 0);
    const aov = todayOrders.length > 0 ? Math.round(totalRevenue / todayOrders.length) : 0;

    const revEl = document.getElementById('stat-today-revenue');
    const countEl = document.getElementById('stat-order-count');
    const bottlesEl = document.getElementById('stat-bottles-sold');
    const upiEl = document.getElementById('stat-upi-revenue');
    const cashEl = document.getElementById('stat-cash-revenue');
    const aovEl = document.getElementById('stat-aov');

    if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString()}`;
    if (countEl) countEl.textContent = `${todayOrders.length} order(s) today`;
    if (bottlesEl) bottlesEl.textContent = `${bottlesSold}`;
    if (upiEl) upiEl.textContent = `UPI: ₹${upiRevenue.toLocaleString()}`;
    if (cashEl) cashEl.textContent = `Cash: ₹${cashRevenue.toLocaleString()}`;
    if (aovEl) aovEl.textContent = `₹${aov}`;

    const tbody = document.getElementById('history-table-body');
    if (!tbody) return;

    if (this.ordersHistory.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No transactions recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.ordersHistory.map(o => `
      <tr>
        <td><strong>#${o.orderId}</strong></td>
        <td>${o.dateFormatted} <small style="color: var(--text-muted);">${o.timeFormatted}</small></td>
        <td>${o.customerName || '<span style="color: #94A3B8;">Walk-in</span>'}</td>
        <td>${o.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td>
        <td><span class="badge-pay ${o.paymentMethod}">${o.paymentMethod.toUpperCase()}</span></td>
        <td><strong>₹${o.grandTotal}</strong></td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn-secondary-action btn-reprint" data-order-id="${o.orderId}" style="display: inline-flex; padding: 4px 8px; font-size: 0.75rem;">🖨️ Reprint</button>
        </td>
      </tr>
    `).join('');
  }

  exportHistoryCsv() {
    if (this.ordersHistory.length === 0) {
      alert('No orders to export!');
      return;
    }

    let csv = 'Order ID,Date,Time,Customer,Phone,Items,Total Quantity,Subtotal,Discount,Tax,Grand Total,Payment Method\n';
    this.ordersHistory.forEach(o => {
      const itemsStr = o.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
      csv += `"${o.orderId}","${o.dateFormatted}","${o.timeFormatted}","${o.customerName || ''}","${o.customerPhone || ''}","${itemsStr}",${o.totalQuantity},${o.subtotal},${o.discountAmount},${o.taxAmount},${o.grandTotal},"${o.paymentMethod}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferman-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /* -------------------------------------------------------------
   * STORE SETTINGS SYNC & PERSISTENCE
   * ----------------------------------------------------------- */
  syncSettingsInputs() {
    const s = this.storeSettings;
    const nameEl = document.getElementById('setting-store-name');
    const taglineEl = document.getElementById('setting-tagline');
    const phoneEl = document.getElementById('setting-phone');
    const footerEl = document.getElementById('setting-footer');
    const topStore = document.getElementById('topbar-store-name');

    if (nameEl) nameEl.value = s.name || '';
    if (taglineEl) taglineEl.value = s.tagline || '';
    if (phoneEl) phoneEl.value = s.phone || '';
    if (footerEl) footerEl.value = s.footerMessage || '';
    if (topStore) topStore.textContent = s.name || 'Ferman Craft Fermentation Co.';
  }

  saveSettings() {
    this.storeSettings = {
      name: document.getElementById('setting-store-name')?.value.trim() || 'Ferman Craft Fermentation Co.',
      tagline: document.getElementById('setting-tagline')?.value.trim() || 'Live, Small-Batch Kombucha & Ginger Beer',
      phone: document.getElementById('setting-phone')?.value.trim() || '+91 98999 52525',
      footerMessage: document.getElementById('setting-footer')?.value.trim() || 'Keep Refrigerated 2°C-6°C • Instagram: @ferman.in',
      fssai: '13326003000277',
      gstin: '07BNPPK0957B2ZZ'
    };

    localStorage.setItem('ferman_store_settings_v4', JSON.stringify(this.storeSettings));
    this.syncSettingsInputs();
    this.playSound('click');
    alert('Settings saved successfully!');
  }

  /* -------------------------------------------------------------
   * EVENT LISTENERS (CLICKS, INPUTS, SHORTCUTS)
   * ----------------------------------------------------------- */
  initEventListeners() {
    // Navigation Tabs
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        btn.classList.add('active');
        const targetView = document.getElementById(`view-${btn.dataset.view}`);
        if (targetView) targetView.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });

    // Mobile POS View Switcher
    document.getElementById('tab-mobile-catalog')?.addEventListener('click', () => this.switchMobilePosView('catalog'));
    document.getElementById('tab-mobile-cart')?.addEventListener('click', () => this.switchMobilePosView('cart'));
    document.getElementById('btn-mobile-view-bill')?.addEventListener('click', () => this.switchMobilePosView('cart'));
    document.getElementById('btn-mobile-back-catalog')?.addEventListener('click', () => this.switchMobilePosView('catalog'));

    // Category chips
    document.querySelectorAll('.chip-btn').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.chip-btn').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentCategory = chip.dataset.category;
        this.renderProducts();
      });
    });

    // Search bar
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderProducts();
      });
    }

    // Product Grid Clicks
    const grid = document.getElementById('products-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const card = e.target.closest('.product-card');
        if (card && card.dataset.id) {
          this.addToCart(card.dataset.id);
        }
      });
    }

    // Cart Actions
    const cartWrapper = document.getElementById('cart-items-wrapper');
    if (cartWrapper) {
      cartWrapper.addEventListener('click', (e) => {
        const incBtn = e.target.closest('[data-action="inc"]');
        const decBtn = e.target.closest('[data-action="dec"]');
        const removeBtn = e.target.closest('.btn-remove-item');

        if (incBtn) this.updateQuantity(incBtn.dataset.id, 1);
        if (decBtn) this.updateQuantity(decBtn.dataset.id, -1);
        if (removeBtn) this.removeFromCart(removeBtn.dataset.id);
      });
    }

    // Clear cart button
    document.getElementById('btn-clear-cart')?.addEventListener('click', () => this.clearCart());

    // Discount & Tax selects
    document.getElementById('discount-select')?.addEventListener('change', (e) => {
      this.discountPercent = parseFloat(e.target.value) || 0;
      this.updateCartUi();
    });

    document.getElementById('tax-select')?.addEventListener('change', (e) => {
      this.taxPercent = parseFloat(e.target.value) || 0;
      this.updateCartUi();
    });

    // Payment method selector
    document.querySelectorAll('.pay-method-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.pay-method-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.paymentMethod = btn.dataset.method;

        const cashBox = document.getElementById('cash-tender-box');
        if (cashBox) {
          if (this.paymentMethod === 'cash') {
            cashBox.classList.add('active');
          } else {
            cashBox.classList.remove('active');
          }
        }
        this.playSound('click');
      });
    });

    // Cash tendered input
    document.getElementById('cash-tendered-input')?.addEventListener('input', () => {
      this.updateCartUi();
    });

    // Top Hardware Pill click
    document.getElementById('printer-status-badge')?.addEventListener('click', () => {
      document.querySelector('[data-view="settings"]')?.click();
    });

    // Connect Bluetooth button
    document.getElementById('btn-pair-bluetooth')?.addEventListener('click', async () => {
      try {
        await window.SeznikPrinter.connectBluetooth();
      } catch (err) {
        console.warn('Bluetooth pairing error:', err);
      }
    });

    // Connect USB button
    document.getElementById('btn-connect-usb')?.addEventListener('click', async () => {
      try {
        await window.SeznikPrinter.connectSerial();
      } catch (err) {
        console.warn('USB Serial pairing error:', err);
      }
    });

    // Diagnostic Self-Test button
    document.getElementById('btn-run-diag-test')?.addEventListener('click', async () => {
      try {
        if (!window.SeznikPrinter.isConnected) {
          await window.SeznikPrinter.connectBluetooth();
        }
        await window.SeznikPrinter.printTestReceipt();
      } catch (err) {
        alert(`Test Print Note: ${err.message}`);
      }
    });

    document.getElementById('btn-quick-test-print')?.addEventListener('click', () => {
      document.getElementById('btn-run-diag-test')?.click();
    });

    // Main Print Button
    document.getElementById('btn-print-seznik')?.addEventListener('click', () => {
      this.handlePrintSeznik();
    });

    // Secondary actions
    document.getElementById('btn-system-print')?.addEventListener('click', () => {
      this.handleSystemPrint();
    });

    document.getElementById('btn-view-preview')?.addEventListener('click', () => {
      this.openThermalPreview();
    });

    document.getElementById('btn-preview-direct-print')?.addEventListener('click', () => {
      document.getElementById('modal-thermal-preview')?.classList.remove('active');
      this.handlePrintSeznik();
    });

    // Sound toggle
    document.getElementById('btn-toggle-sound')?.addEventListener('click', (e) => {
      this.soundEnabled = !this.soundEnabled;
      e.currentTarget.textContent = this.soundEnabled ? '🔊' : '🔇';
    });

    // Fullscreen toggle
    document.getElementById('btn-toggle-fullscreen')?.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    // Modals Close

    document.getElementById('btn-close-custom')?.addEventListener('click', () => {
      document.getElementById('modal-custom-item')?.classList.remove('active');
    });

    document.getElementById('btn-close-preview')?.addEventListener('click', () => {
      document.getElementById('modal-thermal-preview')?.classList.remove('active');
    });

    // Add Custom Item
    document.getElementById('btn-open-custom-item')?.addEventListener('click', () => {
      document.getElementById('modal-custom-item')?.classList.add('active');
    });

    document.getElementById('btn-add-custom-confirm')?.addEventListener('click', () => {
      const name = document.getElementById('custom-item-name')?.value.trim();
      const price = parseFloat(document.getElementById('custom-item-price')?.value || '0');
      const category = document.getElementById('custom-item-cat')?.value || 'ginger';

      if (!name || price <= 0) {
        alert('Please enter a valid item name and price.');
        return;
      }

      const customId = `custom-${Date.now()}`;
      const newItem = {
        id: customId,
        name,
        category,
        price,
        tag: 'Custom Item / Add-on',
        image: 'assets/ginger-bottle.webp'
      };

      this.products.unshift(newItem);
      this.addToCart(customId);
      this.renderProducts();

      document.getElementById('custom-item-name').value = '';
      document.getElementById('custom-item-price').value = '';
      document.getElementById('modal-custom-item')?.classList.remove('active');
    });

    // Reprint from History Table
    document.getElementById('history-table-body')?.addEventListener('click', (e) => {
      const reprintBtn = e.target.closest('.btn-reprint');
      if (reprintBtn) {
        const orderId = reprintBtn.dataset.orderId;
        const pastOrder = this.ordersHistory.find(o => o.orderId === orderId);
        if (pastOrder) {
          if (window.SeznikPrinter.isConnected) {
            const buf = window.SeznikPrinter.buildReceiptCommands(pastOrder, this.storeSettings);
            window.SeznikPrinter.printEscPos(buf);
          } else {
            this.handleSystemPrint(pastOrder);
          }
        }
      }
    });

    // Export CSV
    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
      this.exportHistoryCsv();
    });

    // Clear History Log
    document.getElementById('btn-clear-history')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear transaction history? This cannot be undone.')) {
        this.ordersHistory = [];
        localStorage.removeItem('ferman_orders_history');
        this.renderHistory();
      }
    });

    // Save Settings
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.saveSettings();
    });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        this.handlePrintSeznik();
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      }
    });
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.PosInstance = new PosApp();
});

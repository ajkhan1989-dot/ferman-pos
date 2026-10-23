/**
 * SEZNIK VEER 58mm Portable Thermal Printer Engine
 * Supports:
 *  - Web Bluetooth API (GATT ESC/POS)
 *  - Web Serial API (USB ESC/POS)
 *  - Universal 58mm Browser Thermal Print Spooler
 *  - Dynamic ESC/POS Byte Stream Formatter (384 dots, 32 chars/line)
 */

class SeznikVeerPrinter {
  constructor() {
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.serialPort = null;
    this.serialWriter = null;
    this.connectionType = 'none'; // 'bluetooth' | 'serial' | 'none'
    this.statusListeners = [];
    this.charsPerLine = 32; // Standard 58mm (2-inch) thermal printer
    this.isConnected = false;
    this.deviceName = 'Seznik Veer';
  }

  // Register status change callbacks
  onStatusChange(callback) {
    this.statusListeners.push(callback);
  }

  _notifyStatus(status, details = {}) {
    this.isConnected = this.connectionType !== 'none';
    this.statusListeners.forEach((cb) => cb({
      status,
      type: this.connectionType,
      deviceName: this.deviceName,
      ...details
    }));
  }

  /* -------------------------------------------------------------
   * 1. WEB BLUETOOTH CONNECTION (Seznik Veer BLE / SPP)
   * ----------------------------------------------------------- */
  async connectBluetooth() {
    if (!navigator.bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
    }

    this._notifyStatus('connecting', { message: 'Pairing with SEZNIK Veer...' });

    try {
      // Common BLE thermal printer service UUIDs including Seznik, B41, MTP-II, ISSC
      const PRINTER_SERVICES = [
        '000018f0-0000-1000-8000-00805f9b34fb', // Standard BLE POS Printer
        '0000ff00-0000-1000-8000-00805f9b34fb', // Vendor Specific
        '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Transparent UART
        'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Serial port BLE
        '0000fee7-0000-1000-8000-00805f9b34fb'  // Alternative ESC/POS
      ];

      // Request device with name filter or accept all devices with optional services
      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: PRINTER_SERVICES
      });

      this.deviceName = this.device.name || 'SEZNIK Veer 58mm';
      this.device.addEventListener('gattserverdisconnected', () => {
        this.connectionType = 'none';
        this.characteristic = null;
        this._notifyStatus('disconnected', { message: 'SEZNIK Veer disconnected' });
      });

      this._notifyStatus('connecting', { message: `Connecting to ${this.deviceName}...` });
      this.server = await this.device.gatt.connect();

      // Find the first matching writable service & characteristic
      let targetChar = null;
      for (const serviceUuid of PRINTER_SERVICES) {
        try {
          const service = await this.server.getPrimaryService(serviceUuid);
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              targetChar = char;
              this.service = service;
              break;
            }
          }
          if (targetChar) break;
        } catch (e) {
          // Continue searching other services
        }
      }

      // If not found in standard services, try all discovered services
      if (!targetChar) {
        const services = await this.server.getPrimaryServices();
        for (const s of services) {
          try {
            const chars = await s.getCharacteristics();
            for (const c of chars) {
              if (c.properties.write || c.properties.writeWithoutResponse) {
                targetChar = c;
                this.service = s;
                break;
              }
            }
            if (targetChar) break;
          } catch (e) {
            // Ignore
          }
        }
      }

      if (!targetChar) {
        throw new Error('Connected to Bluetooth device, but could not find a writable ESC/POS print channel.');
      }

      this.characteristic = targetChar;
      this.connectionType = 'bluetooth';
      this._notifyStatus('connected', { message: `Connected to ${this.deviceName} (Ready)` });
      return true;
    } catch (err) {
      this.connectionType = 'none';
      this._notifyStatus('error', { message: err.message || 'Failed to connect via Bluetooth' });
      throw err;
    }
  }

  /* -------------------------------------------------------------
   * 2. WEB SERIAL CONNECTION (USB Type-C Cable on PC/Mac)
   * ----------------------------------------------------------- */
  async connectSerial(baudRate = 9600) {
    if (!navigator.serial) {
      throw new Error('Web Serial is not supported in this browser. Please use Chrome or Edge on desktop.');
    }

    this._notifyStatus('connecting', { message: 'Opening USB Serial port...' });

    try {
      this.serialPort = await navigator.serial.requestPort();
      await this.serialPort.open({ baudRate });
      this.serialWriter = this.serialPort.writable.getWriter();
      this.connectionType = 'serial';
      this.deviceName = 'SEZNIK Veer (USB)';
      this._notifyStatus('connected', { message: 'Connected to SEZNIK Veer via USB' });
      return true;
    } catch (err) {
      this.connectionType = 'none';
      this._notifyStatus('error', { message: err.message || 'Failed to open USB port' });
      throw err;
    }
  }

  /* -------------------------------------------------------------
   * 3. DISCONNECT
   * ----------------------------------------------------------- */
  async disconnect() {
    try {
      if (this.connectionType === 'bluetooth' && this.device?.gatt?.connected) {
        this.device.gatt.disconnect();
      }
      if (this.connectionType === 'serial' && this.serialWriter) {
        await this.serialWriter.close();
        await this.serialPort.close();
      }
    } catch (e) {
      console.warn('Disconnect warning:', e);
    } finally {
      this.connectionType = 'none';
      this.characteristic = null;
      this.serialWriter = null;
      this._notifyStatus('disconnected', { message: 'Printer disconnected' });
    }
  }

  /* -------------------------------------------------------------
   * 4. ESC/POS BYTE STREAM BUILDER FOR 58mm THERMAL PRINTER
   * ----------------------------------------------------------- */
  buildReceiptCommands(orderData, storeSettings) {
    const builder = new EscPosBuilder(this.charsPerLine);

    // Initialize printer
    builder.init();
    builder.setLineSpacing(30);

    // Header: Store Name (Double Height + Bold)
    builder.align('center');
    builder.setTextSize(1, 1);
    builder.bold(true);
    builder.textLine('FERMAN CRAFT');
    builder.textLine('FERMENTATION CO.');
    builder.setTextSize(0, 0);
    builder.bold(false);

    builder.textLine('Live, Small-Batch Kombucha');
    builder.textLine('& Ginger Beer');
    if (storeSettings.phone) {
      builder.textLine(`Ph: ${storeSettings.phone}`);
    }
    if (storeSettings.fssai) {
      builder.textLine(`FSSAI: ${storeSettings.fssai}`);
    }
    builder.textLine(`GSTIN: ${storeSettings.gstin || '07BNPPK0957B2ZZ'}`);

    builder.divider('=');

    // Order Info
    builder.align('left');
    builder.twoColumns(`Bill No: ${orderData.orderId}`, `Date: ${orderData.dateFormatted}`);
    builder.twoColumns(`Time: ${orderData.timeFormatted}`, `Pay: ${orderData.paymentMethod.toUpperCase()}`);
    if (orderData.customerName) {
      builder.textLine(`Customer: ${orderData.customerName}${orderData.customerPhone ? ' (' + orderData.customerPhone + ')' : ''}`);
    }

    builder.divider('-');

    // Itemized table header
    // Total 32 chars: Item(16) Qty(4) Rate(5) Amt(7)
    builder.bold(true);
    builder.lineFormatted([
      { text: 'ITEM', width: 15, align: 'left' },
      { text: 'QTY', width: 4, align: 'right' },
      { text: 'RATE', width: 6, align: 'right' },
      { text: 'AMT', width: 7, align: 'right' }
    ]);
    builder.bold(false);
    builder.divider('-');

    // Items
    orderData.items.forEach(item => {
      const itemAmt = (item.price * item.quantity).toFixed(0);
      const name = item.name.length > 15 ? item.name.substring(0, 15) : item.name;
      builder.lineFormatted([
        { text: name, width: 15, align: 'left' },
        { text: `${item.quantity}`, width: 4, align: 'right' },
        { text: `${item.price}`, width: 6, align: 'right' },
        { text: `${itemAmt}`, width: 7, align: 'right' }
      ]);
    });

    builder.divider('-');

    // Subtotal & Calculations
    builder.twoColumns('Subtotal (MRP):', `Rs. ${orderData.subtotal.toFixed(0)}`);
    if (orderData.discountAmount > 0) {
      builder.twoColumns(`Discount (${orderData.discountPercent}%):`, `-Rs. ${orderData.discountAmount.toFixed(2)}`);
    }
    if (orderData.taxAmount > 0) {
      const taxable = orderData.taxableAmount || (orderData.grandTotal / 1.05);
      const cgst = orderData.cgstAmount || (orderData.taxAmount / 2);
      const sgst = orderData.sgstAmount || (orderData.taxAmount / 2);
      builder.twoColumns('Net Taxable:', `Rs. ${taxable.toFixed(2)}`);
      builder.twoColumns('CGST (2.5%):', `Rs. ${cgst.toFixed(2)}`);
      builder.twoColumns('SGST (2.5%):', `Rs. ${sgst.toFixed(2)}`);
      builder.twoColumns('5% GST (Incl):', `Rs. ${orderData.taxAmount.toFixed(2)}`);
    }

    builder.divider('=');

    // Grand Total (Bold, single-line to fit 32 columns cleanly)
    builder.bold(true);
    builder.setTextSize(0, 0);
    builder.twoColumns('TOTAL (INCL GST):', `Rs. ${orderData.grandTotal.toFixed(0)}`);
    builder.bold(false);

    builder.divider('=');

    // Payment details
    if (orderData.paymentMethod === 'cash' && orderData.cashTendered) {
      builder.twoColumns('Cash Tendered:', `Rs. ${orderData.cashTendered.toFixed(0)}`);
      builder.twoColumns('Change Return:', `Rs. ${(orderData.cashTendered - orderData.grandTotal).toFixed(0)}`);
    }

    // Total Items count
    builder.textLine(`Total Quantity: ${orderData.totalQuantity} bottle(s)`);
    builder.feed(1);

    // Footer Message
    builder.align('center');
    builder.textLine('Keep Refrigerated 2°C - 6°C');
    builder.textLine('Instagram: @ferman.in');

    // Feed lines & optional cut
    builder.feed(4);
    builder.cut();

    return builder.getBuffer();
  }

  /* -------------------------------------------------------------
   * 5. SEND ESC/POS DATA TO CONNECTED PRINTER
   * ----------------------------------------------------------- */
  async printEscPos(buffer) {
    if (this.connectionType === 'bluetooth') {
      if (!this.characteristic) {
        throw new Error('Bluetooth printer characteristic not ready.');
      }
      this._notifyStatus('printing', { message: 'Printing via Bluetooth...' });

      // Chunk data to 50 bytes to avoid BLE GATT MTU overflow
      const chunkSize = 50;
      for (let i = 0; i < buffer.length; i += chunkSize) {
        const chunk = buffer.slice(i, i + chunkSize);
        if (this.characteristic.properties.writeWithoutResponse) {
          await this.characteristic.writeValueWithoutResponse(chunk);
        } else {
          await this.characteristic.writeValue(chunk);
        }
        // Small delay to let thermal print head execute
        await new Promise((r) => setTimeout(r, 20));
      }
      this._notifyStatus('connected', { message: 'Receipt printed successfully!' });
      return true;
    } else if (this.connectionType === 'serial') {
      if (!this.serialWriter) {
        throw new Error('Serial writer not ready.');
      }
      this._notifyStatus('printing', { message: 'Printing via USB Serial...' });
      await this.serialWriter.write(buffer);
      this._notifyStatus('connected', { message: 'Receipt printed successfully!' });
      return true;
    } else {
      throw new Error('No printer directly connected. Please connect via Bluetooth or USB, or use Browser Print.');
    }
  }

  /* -------------------------------------------------------------
   * 6. TEST PRINT
   * ----------------------------------------------------------- */
  async printTestReceipt() {
    const builder = new EscPosBuilder(this.charsPerLine);
    builder.init();
    builder.align('center');
    builder.setTextSize(1, 1);
    builder.bold(true);
    builder.textLine('SEZNIK VEER');
    builder.setTextSize(0, 0);
    builder.bold(false);
    builder.textLine('58mm Thermal Printer Test');
    builder.divider('=');
    builder.align('left');
    builder.textLine('Model: Seznik Veer (2-Inch)');
    builder.textLine(`Paper: 58mm (Width 384 Dots)`);
    builder.textLine(`Status: OK / High Speed`);
    builder.textLine(`Timestamp: ${new Date().toLocaleString()}`);
    builder.divider('-');
    builder.textLine('01234567890123456789012345678901'); // 32 chars check
    builder.divider('=');
    builder.align('center');
    builder.bold(true);
    builder.textLine('FERMAN CRAFT BEVERAGES');
    builder.bold(false);
    builder.textLine('Test Print Successful!');
    builder.feed(4);
    builder.cut();

    await this.printEscPos(builder.getBuffer());
  }
}

/* -------------------------------------------------------------
 * HELPER: ESC/POS COMMAND BUILDER
 * ----------------------------------------------------------- */
class EscPosBuilder {
  constructor(charsPerLine = 32) {
    this.width = charsPerLine;
    this.buffer = [];
  }

  addBytes(...bytes) {
    this.buffer.push(...bytes);
  }

  init() {
    this.addBytes(0x1B, 0x40); // ESC @ (Reset/Init)
    this.addBytes(0x1B, 0x74, 0x00); // ESC t 0 (CP437 USA / Standard Europe character table)
  }

  align(alignment) {
    // 0: Left, 1: Center, 2: Right
    const code = alignment === 'center' ? 1 : alignment === 'right' ? 2 : 0;
    this.addBytes(0x1B, 0x61, code);
  }

  bold(enable) {
    this.addBytes(0x1B, 0x45, enable ? 1 : 0);
  }

  setTextSize(widthMult = 0, heightMult = 0) {
    // 0x1D 0x21 n (n: high nibble width, low nibble height)
    const n = ((widthMult & 0x07) << 4) | (heightMult & 0x07);
    this.addBytes(0x1D, 0x21, n);
  }

  setLineSpacing(dots = 30) {
    this.addBytes(0x1B, 0x33, dots);
  }

  feed(lines = 1) {
    this.addBytes(0x1B, 0x64, lines);
  }

  cut() {
    // Full or partial cut (GS V 66 0)
    this.addBytes(0x1D, 0x56, 0x42, 0x00);
  }

  text(str) {
    // Convert string to bytes with CP437 mapping for special symbols
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === '°') {
        this.buffer.push(0xF8); // CP437 degree symbol °
        continue;
      }
      if (char === '•') {
        this.buffer.push(0xF9); // CP437 middle dot / bullet
        continue;
      }
      if (char === '₹') {
        this.text('Rs.');
        continue;
      }
      let code = str.charCodeAt(i);
      if (code > 255) code = 63; // '?' for unencodable characters
      this.buffer.push(code);
    }
  }

  textLine(str = '') {
    this.text(str);
    this.buffer.push(0x0A); // LF
  }

  divider(char = '-') {
    this.textLine(char.repeat(this.width));
  }

  twoColumns(left, right) {
    const leftStr = String(left);
    const rightStr = String(right);
    const spaceCount = this.width - leftStr.length - rightStr.length;
    if (spaceCount > 0) {
      this.textLine(leftStr + ' '.repeat(spaceCount) + rightStr);
    } else {
      this.textLine(leftStr);
      this.textLine(' '.repeat(Math.max(0, this.width - rightStr.length)) + rightStr);
    }
  }

  lineFormatted(columns) {
    // columns: [{ text, width, align }]
    let out = '';
    columns.forEach(col => {
      let t = String(col.text);
      if (t.length > col.width) {
        t = t.substring(0, col.width);
      }
      const pad = col.width - t.length;
      if (col.align === 'right') {
        out += ' '.repeat(Math.max(0, pad)) + t;
      } else if (col.align === 'center') {
        const leftPad = Math.floor(pad / 2);
        const rightPad = pad - leftPad;
        out += ' '.repeat(Math.max(0, leftPad)) + t + ' '.repeat(Math.max(0, rightPad));
      } else {
        out += t + ' '.repeat(Math.max(0, pad));
      }
    });
    this.textLine(out);
  }

  getBuffer() {
    return new Uint8Array(this.buffer);
  }
}

// Export single instance globally
window.SeznikPrinter = new SeznikVeerPrinter();

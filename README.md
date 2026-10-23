# FERMAN POS • SEZNIK Veer 58mm Online Billing App

A specialized Point-of-Sale (POS) and thermal billing web application custom-built for **FerMan Craft Beverages** and optimized for the **SEZNIK Veer 58mm (2-inch)** portable Bluetooth/USB thermal receipt printer.

---

## 🚀 Quick Start

1. Start the local server:
   ```bash
   npm run billing
   ```
2. Open your browser at:
   ```
   http://localhost:3030
   ```
   *(Works in Chrome, Edge, and Android Chrome on tablets & mobile phones)*

---

## 🖨️ SEZNIK Veer Hardware Connectivity

### 1. Wireless Web Bluetooth (Recommended for Cart & Mobile)
* Turn on your **SEZNIK Veer** printer (ensure blue indicator light is active).
* Click the **"Veer: Disconnected"** badge on the top right or go to the **Setup** tab and tap **"Connect Bluetooth (BLE)"**.
* Chrome/Edge will open the pairing drawer. Select your printer (`SEZNIK`, `Veer`, `B-41`, or `Thermal Printer`).
* Once paired, the status badge turns 🟢 **Veer: Connected (BLUETOOTH)**.
* Pressing **"PRINT TO SEZNIK VEER"** or `F2` directly sends ESC/POS thermal command bytes to the printer!

### 2. Wired USB Serial (Type-C Cable on PC/Laptop)
* Connect the printer to your computer using a USB Type-C cable.
* In the **Setup** tab, click **"Connect USB Serial"** and select the printer's COM port.

### 3. Universal 58mm Browser Spooler
* If using standard Windows print drivers or Android print plugins (RawBT / Seznik Print), click **"58mm Print"**.
* The app automatically formats the receipt with strict 58mm margins (`@page { size: 58mm auto; margin: 0; }`) for clean thermal output.

---

## ✨ Features

- **Preloaded Catalog**: All 8 FerMan bottles (*Ginger Original, Mango, Cranberry, Pink Guava, Mango Unchained Kombucha, Berry Potter, Tropical Thunder, Pomegrenade*) with spice/tang ratings and images.
- **Custom Items**: Add tasting flights, gift boxes, or merchandise with 1 click.
- **Dynamic UPI QR Code**: Generates real-time, 100% offline BHIM UPI QR codes with your exact order total for GPay / PhonePe / Paytm scan-and-pay.
- **WhatsApp Receipts**: 1-tap sharing of itemized digital receipts directly to customer WhatsApp numbers.
- **58mm Thermal Tape Slip Preview**: Realistic on-screen simulation of physical thermal paper tape.
- **Sales History & Analytics**: Tracks today's revenue, bottles sold, cash vs. UPI breakdown, and exports full logs to CSV.
- **Store Customization**: Custom stall names, address, phone number, GSTIN, FSSAI license, and receipt footer messages.

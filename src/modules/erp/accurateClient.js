const axios = require('axios');

class AccurateClient {
  constructor() {
    this.enabled = process.env.ACCURATE_ENABLED === 'true';
    this.apiUrl = process.env.ACCURATE_API_URL || 'https://zeus.accurate.id/accurate/api';
    this.clientId = process.env.ACCURATE_CLIENT_ID || '';
    this.clientSecret = process.env.ACCURATE_CLIENT_SECRET || '';
    this.accessToken = process.env.ACCURATE_ACCESS_TOKEN || '';
    this.databaseId = process.env.ACCURATE_DATABASE_ID || '';
  }

  getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'X-Session-ID': this.databaseId,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Cek status koneksi ke Accurate Online
   */
  async checkConnection() {
    if (!this.enabled || !this.accessToken) {
      return {
        connected: false,
        message: 'Accurate Online belum diaktifkan (ACCURATE_ENABLED=false).'
      };
    }

    try {
      const res = await axios.get(`${this.apiUrl}/company/get-info.do`, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      return { connected: true, data: res.data };
    } catch (err) {
      return {
        connected: false,
        error: err.response?.data?.d || err.message,
        mode: 'ERROR_CONNECTING'
      };
    }
  }

  /**
   * Buat Pesanan Penjualan (Sales Order) di Accurate Online
   */
  async createSalesOrder({ customerName, customerPhone, items, totalAmount, notes }) {
    if (!this.enabled || !this.accessToken) {
      // Tidak menghasilkan mock/fake data, murni bypass
      return {
        success: false,
        enabled: false,
        message: 'Accurate Online tidak diaktifkan.'
      };
    }

    try {
      const payload = {
        transDate: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
        description: `Order via WhatsApp Bot: ${notes || customerPhone}`,
        detailItem: items.map(item => ({
          itemNo: item.itemCode || process.env.ACCURATE_ITEM_CODE || 'GALON-19L',
          unitPrice: item.price,
          quantity: item.qty
        }))
      };

      const res = await axios.post(`${this.apiUrl}/sales-order/save.do`, payload, {
        headers: this.getHeaders()
      });

      if (res.data.s) {
        return {
          success: true,
          accurateSoNo: res.data.r.number,
          raw: res.data.r
        };
      } else {
        throw new Error(res.data.d || 'Gagal membuat Sales Order di Accurate');
      }
    } catch (err) {
      console.error('[ACCURATE ERROR] createSalesOrder:', err.response?.data || err.message);
      return {
        success: false,
        error: err.response?.data?.d || err.message
      };
    }
  }

  /**
   * Catat Pelunasan / Penerimaan Penjualan (Sales Receipt)
   * Berdasarkan bukti transfer bank
   */
  async createSalesReceipt({ invoiceNo, amount, bankAccountNo, refId, memo }) {
    if (!this.enabled || !this.accessToken) {
      return {
        success: false,
        enabled: false,
        message: 'Accurate Online tidak diaktifkan.'
      };
    }

    try {
      const payload = {
        transDate: new Date().toLocaleDateString('en-GB'),
        bankNo: bankAccountNo || process.env.ACCURATE_BANK_ACCOUNT_CODE || '110101',
        chequeAmount: amount,
        description: `Pelunasan transfer BCA - Ref: ${refId}. ${memo || ''}`,
        detailInvoice: [
          {
            invoiceNo: invoiceNo,
            paymentAmount: amount
          }
        ]
      };

      const res = await axios.post(`${this.apiUrl}/sales-receipt/save.do`, payload, {
        headers: this.getHeaders()
      });

      return {
        success: true,
        accurateReceiptNo: res.data.r?.number,
        raw: res.data
      };
    } catch (err) {
      console.error('[ACCURATE ERROR] createSalesReceipt:', err.response?.data || err.message);
      return {
        success: false,
        error: err.response?.data?.d || err.message
      };
    }
  }

  /**
   * Cek Saldo atau Mutasi Rekening Bank di Accurate
   */
  async checkBankBalance(accountNo = process.env.ACCURATE_BANK_ACCOUNT_CODE || '110101') {
    if (!this.enabled || !this.accessToken) {
      return {
        connected: false,
        message: 'Accurate Online tidak diaktifkan.'
      };
    }

    try {
      const res = await axios.get(`${this.apiUrl}/glaccount/get-balance.do?no=${accountNo}`, {
        headers: this.getHeaders()
      });
      return {
        success: true,
        data: res.data.r
      };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.d || err.message
      };
    }
  }
}

module.exports = new AccurateClient();

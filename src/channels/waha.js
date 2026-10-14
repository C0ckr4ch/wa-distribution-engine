const axios = require('axios');

class WahaClient {
  constructor(baseUrl = process.env.WAHA_API_URL || 'http://localhost:3000', session = process.env.WAHA_SESSION || 'default') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.session = session;
    this.apiKey = process.env.WAHA_API_KEY || 'waha_secret_key_123';
    this.sentMessageIds = new Set();
  }

  getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  async checkHealth() {
    try {
      const res = await axios.get(`${this.baseUrl}/api/server/version`, {
        headers: this.getHeaders(),
        timeout: 3000
      });
      return { online: true, version: res.data };
    } catch (err) {
      return { online: false, error: err.response?.data || err.message };
    }
  }

  async getSessionStatus() {
    try {
      const res = await axios.get(`${this.baseUrl}/api/sessions/${this.session}`, {
        headers: this.getHeaders(),
        timeout: 3000
      });
      return res.data;
    } catch (err) {
      return { status: 'STOPPED', error: err.response?.data || err.message };
    }
  }

  async startSession() {
    try {
      const statusRes = await axios.get(`${this.baseUrl}/api/sessions/${this.session}`, {
        headers: this.getHeaders()
      }).catch(() => null);

      if (statusRes?.data?.status === 'FAILED') {
        await axios.delete(`${this.baseUrl}/api/sessions/${this.session}`, {
          headers: this.getHeaders()
        }).catch(() => {});
      }

      await axios.post(
        `${this.baseUrl}/api/sessions`,
        {
          name: this.session,
          config: {
            webhooks: [
              {
                url: process.env.WEBHOOK_URL || 'http://localhost:5000/webhook/whatsapp',
                events: ['message']
              }
            ]
          }
        },
        { headers: this.getHeaders() }
      ).catch(() => {});

      const startRes = await axios.post(
        `${this.baseUrl}/api/sessions/${this.session}/start`,
        {},
        { headers: this.getHeaders() }
      );
      return startRes.data;
    } catch (err) {
      return { status: 'ERROR', error: err.response?.data || err.message };
    }
  }

  async logout() {
    try {
      await axios.post(
        `${this.baseUrl}/api/sessions/${this.session}/logout`,
        {},
        { headers: this.getHeaders() }
      ).catch(() => {});

      await axios.delete(
        `${this.baseUrl}/api/sessions/${this.session}`,
        { headers: this.getHeaders() }
      ).catch(() => {});

      return await this.startSession();
    } catch (err) {
      return { status: 'ERROR', error: err.response?.data || err.message };
    }
  }

  async getQrCode() {
    try {
      const res = await axios.get(`${this.baseUrl}/api/${this.session}/auth/qr`, {
        headers: { 'x-api-key': this.apiKey },
        responseType: 'arraybuffer',
        timeout: 5000
      });
      const base64 = Buffer.from(res.data, 'binary').toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (err) {
      return null;
    }
  }

  async sendText(chatId, text) {
    try {
      const formattedChatId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
      const res = await axios.post(
        `${this.baseUrl}/api/sendText`,
        {
          session: this.session,
          chatId: formattedChatId,
          text
        },
        { headers: this.getHeaders() }
      );
      if (res.data?.id) this.sentMessageIds.add(res.data.id);
      if (res.data?.key?.id) this.sentMessageIds.add(res.data.key.id);
      return res.data;
    } catch (err) {
      console.error(`Failed to send WhatsApp message to ${chatId}:`, err.response?.data || err.message);
      return false;
    }
  }

  async sendImage(chatId, fileUrl, caption = '') {
    try {
      const formattedChatId = chatId.includes('@') ? chatId : `${chatId}@c.us`;
      const res = await axios.post(
        `${this.baseUrl}/api/sendFile`,
        {
          session: this.session,
          chatId: formattedChatId,
          file: {
            url: fileUrl
          },
          caption
        },
        { headers: this.getHeaders() }
      );
      return res.data;
    } catch (err) {
      console.error(`Failed to send WhatsApp image to ${chatId}:`, err.response?.data || err.message);
      return false;
    }
  }
}

module.exports = new WahaClient();

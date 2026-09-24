'use strict';
// Telegram delivers background alerts. This inbox handles visible app alerts.
class UmanNotifications {
  constructor({act, openRide}) {
    this.act = act;
    this.openRide = openRide;
    this.user = null;
    this.seen = new Set();
    this.sound = false;
    this.audio = null;
    this.items = [];
    this.baseTitle = document.title;
    this.root = document.createElement('section');
    this.root.className = 'notification-center';
    this.root.innerHTML = '<div class="notification-toolbar"><button type="button" id="inbox-toggle" aria-expanded="false" aria-controls="inbox-list"></button><button type="button" id="inbox-sound" aria-pressed="false"></button></div><p id="inbox-connection" role="status"></p><div id="inbox-banner" role="status" aria-live="polite" hidden></div><section id="inbox-list" hidden><h2 id="inbox-heading" tabindex="-1"></h2><p id="inbox-help"></p><div id="inbox-items"></div></section>';
    document.querySelector('.panel').prepend(this.root);
    this.root.addEventListener('click', event => this.click(event));
    this.root.addEventListener('keydown', event => {
      if (event.key === 'Escape') this.toggle(false);
    });
  }
  label(key) {
    const labels = {
      inbox: ['התראות','Notifications','Уведомления','Сповіщення'],
      sound: ['הפעלת צליל','Enable sound','Включить звук','Увімкнути звук'],
      mute: ['השתקת צליל','Mute sound','Выключить звук','Вимкнути звук'],
      read: ['סימון כנקרא','Mark as read','Прочитано','Прочитано'],
      open: ['פתיחת הנסיעה','Open ride','Открыть поездку','Відкрити поїздку'],
      approve: ['אישור נהג','Approve driver','Одобрить водителя','Схвалити водія'],
      empty: ['אין התראות','No notifications','Нет уведомлений','Немає сповіщень'],
      help: ['50 העדכונים האחרונים. כשהממשק סגור, ההתראות מגיעות בבוט — יש לאפשר התראות וצליל בטלגרם ובמכשיר.','Latest 50 updates. With the app closed, alerts arrive in the bot. Enable Telegram and device notifications and sound.','Последние 50 обновлений. Вне приложения уведомляет бот. Разрешите уведомления и звук Telegram на устройстве.','Останні 50 оновлень. Поза застосунком сповіщає бот. Дозвольте сповіщення та звук Telegram на пристрої.'],
      updated: ['עודכן','Updated','Обновлено','Оновлено'],
      retry: ['החיבור נותק — מנסים להתחבר מחדש','Connection unavailable — reconnecting','Нет связи — переподключение','Немає зв’язку — повторне підключення'],
      soundError: ['לא ניתן להפעיל צליל במכשיר זה','Sound is unavailable on this device','Звук недоступен на устройстве','Звук недоступний на пристрої']
    };
    return labels[key][['he','en','ru','uk'].indexOf(this.lang)] || labels[key][1];
  }
  el(id) { return this.root.querySelector('#' + id); }
  toggle(open) {
    this.el('inbox-list').hidden = !open;
    this.el('inbox-toggle').setAttribute('aria-expanded', String(open));
    if (open) this.el('inbox-heading').focus();
    else this.el('inbox-toggle').focus();
  }
  async click(event) {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.id === 'inbox-toggle') return this.toggle(this.el('inbox-list').hidden);
    if (button.id === 'inbox-sound') {
      if (this.sound) this.sound = false;
      else {
        try {
          this.audio ||= new (window.AudioContext || window.webkitAudioContext)();
          await this.audio.resume();
          if (this.audio.state !== 'running') throw new Error('Audio blocked');
          this.sound = true;
          this.beep();
        } catch { this.el('inbox-connection').textContent = this.label('soundError'); }
      }
      this.soundLabel();
      return;
    }
    if (button.dataset.operation === 'open') { this.toggle(false); this.openRide(); return; }
    const id = Number(button.dataset.notification);
    if (!this.items.some(item => item.id === id)) return;
    button.disabled = true;
    try {
      await this.act(button.dataset.operation === 'approve' ? 'notification_approve' : 'notification_read', {notification_id: id});
    } finally { button.disabled = false; }
  }
  soundLabel() {
    this.el('inbox-sound').textContent = this.label(this.sound ? 'mute' : 'sound');
    this.el('inbox-sound').setAttribute('aria-pressed', String(this.sound));
  }
  beep() {
    if (!this.sound || this.audio?.state !== 'running') return;
    try {
      const oscillator = this.audio.createOscillator(), gain = this.audio.createGain(), at = this.audio.currentTime;
      oscillator.connect(gain); gain.connect(this.audio.destination);
      oscillator.frequency.setValueAtTime(880, at);
      gain.gain.setValueAtTime(0.08, at); gain.gain.exponentialRampToValueAtTime(0.001, at + 0.35);
      oscillator.start(at); oscillator.stop(at + 0.35);
    } catch { /* Visual notification remains available. */ }
  }
  connection(ok) {
    this.el('inbox-connection').textContent = ok ? this.label('updated') + ' ' + new Date().toLocaleTimeString(this.lang) : this.label('retry');
    this.el('inbox-connection').classList.toggle('disconnected', !ok);
  }
  update(state) {
    this.lang = state.user.lang;
    const first = this.user !== state.user.id;
    if (first) { this.user = state.user.id; this.seen.clear(); this.sound = false; this.toggle(false); }
    this.items = state.notifications?.items || [];
    const unread = this.items.filter(item => !item.read);
    const fresh = unread.filter(item => !this.seen.has(item.id));
    this.items.forEach(item => this.seen.add(item.id));
    if (this.seen.size > 500) this.seen = new Set(this.items.map(item => item.id));
    if (!first && fresh.length) this.beep();
    const count = unread.length;
    this.el('inbox-toggle').textContent = '● ' + this.label('inbox') + (count ? ' (' + count + ')' : '');
    this.el('inbox-toggle').classList.toggle('has-unread', count > 0);
    document.title = (count ? '(' + count + ') ' : '') + this.baseTitle;
    this.soundLabel();
    this.el('inbox-heading').textContent = this.label('inbox');
    this.el('inbox-help').textContent = this.label('help');
    const banner = this.el('inbox-banner');
    banner.hidden = !count;
    const bannerText = count ? this.label('inbox') + ' (' + count + ')\n' + unread[0].text : '';
    if (banner.textContent !== bannerText) banner.textContent = bannerText;
    const key = JSON.stringify([this.lang, this.items]);
    if (this.key === key) return;
    this.key = key;
    const list = this.el('inbox-items'); list.replaceChildren();
    if (!this.items.length) list.textContent = this.label('empty');
    for (const item of this.items) {
      const card = document.createElement('article'); card.className = 'notification-card' + (item.read ? '' : ' unread');
      const body = document.createElement('p'); body.textContent = item.text; card.append(body);
      const actions = document.createElement('div'); actions.className = 'notification-actions';
      const add = (operation, label) => {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
        button.dataset.operation = operation; button.dataset.notification = item.id; actions.append(button);
      };
      if (item.approve_driver) add('approve', this.label('approve') + ' #' + item.approve_driver);
      add('open', this.label('open'));
      if (!item.read) add('read', this.label('read'));
      card.append(actions); list.append(card);
    }
  }
}
window.UmanNotifications = UmanNotifications;

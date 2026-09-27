// Browser Push Notification Helper

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function showPushNotification(title: string, message: string, link?: string) {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(title, {
        body: message,
        icon: '/src/assets/images/hero_capital_residence_1790501121492.jpg',
        badge: '/src/assets/images/hero_capital_residence_1790501121492.jpg',
      });

      if (link) {
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      }
    } catch (e) {
      // In some environments, Notification constructor might throw
      console.warn('Native notification failed:', e);
    }
  }
}

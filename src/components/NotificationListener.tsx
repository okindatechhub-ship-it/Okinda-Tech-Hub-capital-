import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiRequest } from '../api/client';
import { Notification } from '../types';
import { showPushNotification, requestNotificationPermission } from '../utils/notifications';

export const NotificationListener: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const lastKnownNotifIdRef = useRef<string | null>(null);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!user) return;

    // Ask for native notification permission once logged in
    requestNotificationPermission();

    const checkNotifications = async () => {
      try {
        const notifs = await apiRequest<Notification[]>('/notifications');
        if (!notifs || !notifs.length) return;

        if (initialLoadRef.current) {
          lastKnownNotifIdRef.current = notifs[0]?.id || null;
          initialLoadRef.current = false;
          return;
        }

        // Check if there are newer notifications
        const latestNotif = notifs[0];
        if (latestNotif && latestNotif.id !== lastKnownNotifIdRef.current) {
          lastKnownNotifIdRef.current = latestNotif.id;

          // Trigger native browser notification push
          showPushNotification(latestNotif.title, latestNotif.message, latestNotif.link);

          // Trigger in-app toast
          toast.info(`${latestNotif.title}: ${latestNotif.message}`);
        }
      } catch {
        // ignore polling errors
      }
    };

    const interval = setInterval(checkNotifications, 4000);
    return () => clearInterval(interval);
  }, [user, toast]);

  return null;
};

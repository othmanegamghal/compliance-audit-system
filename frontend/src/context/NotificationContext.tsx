import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Notification, NotificationType } from '../types';
import { useAuth } from './AuthContext';
import { notificationsApi } from '../api/notifications';

interface Toast {
  id: string;
  message: string;
  type: NotificationType;
  title?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  toasts: Toast[];
  addToast: (message: string, type: NotificationType, title?: string) => void;
  removeToast: (id: string) => void;
  refreshNotifications: () => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: NotificationType, title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type, title }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }
    try {
      const data = await notificationsApi.listMine();
      setNotifications(data);
    } catch {
      // Silent — notifications are non-critical.
    }
  }, [currentUser?.id]);

  // Load notifications when the user logs in / changes.
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await notificationsApi.markRead(id);
    } catch {
      /* optimistic — ignore */
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await notificationsApi.markAllRead();
    } catch {
      /* optimistic — ignore */
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        addToast,
        removeToast,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

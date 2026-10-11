import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Profile, Subscription, Notification } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  token: string | null;
  notifications: Notification[];
  unreadNotifsCount: number;
  onlineUsers: Set<string>;
  login: (token: string, user: User, profile?: Profile, sub?: Subscription) => void;
  logout: () => Promise<void>;
  updateProfileState: (profile: Profile) => void;
  refreshUserData: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  ws: WebSocket | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('naijamatch_token'));
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const wsRef = useRef<WebSocket | null>(null);

  const refreshUserData = async () => {
    const currentToken = token || localStorage.getItem('naijamatch_token');
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.profile);
        setSubscription(data.subscription);
      } else {
        localStorage.removeItem('naijamatch_token');
        setToken(null);
        setUser(null);
        setProfile(null);
        setSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchNotifications();
    }
  }, [user, token]);

  // WebSocket Connection Setup
  useEffect(() => {
    if (!token || !user) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      // Authenticate socket connection
      socket.send(JSON.stringify({ type: 'auth', token }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_notification') {
          fetchNotifications();
        } else if (data.type === 'presence_update') {
          setOnlineUsers((prev) => {
            const next = new Set(prev);
            if (data.isOnline) {
              next.add(data.userId);
            } else {
              next.delete(data.userId);
            }
            return next;
          });
        }
      } catch (e) {
        console.error('WebSocket parse error:', e);
      }
    };

    socket.onclose = () => {
      // Reconnect after brief backoff
    };

    wsRef.current = socket;

    return () => {
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [token, user?.id]);

  const login = (newToken: string, newUser: User, newProfile?: Profile, newSub?: Subscription) => {
    localStorage.setItem('naijamatch_token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newProfile) setProfile(newProfile);
    if (newSub) setSubscription(newSub);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Continue client cleanup
    }
    localStorage.removeItem('naijamatch_token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setSubscription(null);
    setNotifications([]);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const updateProfileState = (newProfile: Profile) => {
    setProfile(newProfile);
  };

  const markNotificationsAsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/messages/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        isLoading,
        token,
        notifications,
        unreadNotifsCount,
        onlineUsers,
        login,
        logout,
        updateProfileState,
        refreshUserData,
        markNotificationsAsRead,
        ws: wsRef.current
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

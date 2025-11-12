export interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen?: Date;
  deviceType?: 'desktop' | 'mobile';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  delivered?: boolean;
  type?: 'text' | 'voice';
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
}
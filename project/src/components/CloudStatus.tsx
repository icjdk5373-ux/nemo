import React, { useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, AlertCircle, X, Server, Download, Globe, Users, MessageCircle, ExternalLink } from 'lucide-react';
import { cloudSync } from '../services/cloudSync';

interface CloudStatusProps {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

export const CloudStatus: React.FC<CloudStatusProps> = ({ 
  isConnected, 
  isConnecting, 
  error 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showServerSetup, setShowServerSetup] = useState(false);

  const downloadServer = () => {
    const message = cloudSync.createAdvancedServer();
    alert(message);
  };

  const openGlobalServer = () => {
    window.open(cloudSync.getGlobalServerUrl(), '_blank');
  };

  // ПОЛНОСТЬЮ УБИРАЕМ ВСЕ УВЕДОМЛЕНИЯ О ПОДКЛЮЧЕНИИ
  return null;
};
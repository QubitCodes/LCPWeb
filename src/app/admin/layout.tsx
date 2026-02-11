'use client';

import React, { useEffect, useState } from 'react';
import { Box, CssBaseline } from '@mui/material';
import { useRouter } from 'next/navigation';
import Sidebar from '../../components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<string>('');
  const [userName, setUserName] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setRole(user.role);
      setUserName(`${user.first_name} ${user.last_name}`);
    } else {
        // Optional: Redirect to login if not found (handled by middleware ideally)
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!isClient) return null; // Prevent hydration mismatch

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Sidebar role={role} userName={userName} onLogout={handleLogout} />
      <Box 
        component="main" 
        sx={{ 
            flexGrow: 1, 
            p: 3, 
            bgcolor: 'background.default',
            width: { sm: `calc(100% - 260px)` },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
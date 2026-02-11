'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CircularProgress, Box } from '@mui/material';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : {};
      
      if(['ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
        router.push('/admin/dashboard');
      } else if (user.role === 'SUPERVISOR') {
        router.push('/admin/supervisor'); 
      } else if (user.role === 'WORKER') {
        router.push('/admin/worker');
      } else {
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
}
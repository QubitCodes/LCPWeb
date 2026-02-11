'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Alert,
  InputAdornment,
  CircularProgress,
  Stack,
  Container,
  useTheme,
  useMediaQuery,
  Link
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import LoginIcon from '@mui/icons-material/Login';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function LoginPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await res.json();

      if (data.status) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Slight delay to show success state
        setTimeout(() => {
             if (['ADMIN', 'SUPER_ADMIN'].includes(data.data.user.role)) {
                router.push('/admin/dashboard');
             } else {
                router.push('/admin/dashboard'); // Fallback
             }
        }, 500);
       
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'white' }}>
      
      {/* Left Side: Brand & Visuals (Hidden on Mobile) */}
      <Box 
        sx={{ 
          flex: 1, 
          display: { xs: 'none', md: 'flex' },
          bgcolor: '#0f172a', // Dark Slate
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6
        }}
      >
        {/* Background Gradients/Effects */}
        <Box sx={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.1,
            background: 'radial-gradient(circle at 10% 20%, rgb(37, 99, 235) 0%, rgb(0, 0, 0) 90.2%)',
            zIndex: 0
        }} />
         
        {/* Top: Brand Name */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box component="span" sx={{ width: 8, height: 8, bgcolor: '#2563eb', borderRadius: '50%' }} />
                LCP PLATFORM
            </Typography>
        </Box>

        {/* Center: Value Prop */}
        <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 480 }}>
            <Typography variant="h2" sx={{ color: 'white', fontWeight: 800, mb: 3, lineHeight: 1.1 }}>
                Empowering the<br />
                <span style={{ color: '#3b82f6' }}>Modern Workforce</span>
            </Typography>
            <Typography variant="body1" sx={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1.6, mb: 4 }}>
                Streamline certifications, manage compliance, and elevate your team's skills with our comprehensive management solution.
            </Typography>
            
            {/* Stats Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 3 }}>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>98%</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Certification Success Rate</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
                    <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>50k+</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>Active Users</Typography>
                </Box>
            </Box>
        </Box>

        {/* Bottom: Footer Info */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
             <Typography variant="body2" sx={{ color: '#64748b' }}>
                Trusted by industry leaders across the globe.
             </Typography>
        </Box>
      </Box>

      {/* Right Side: Login Form */}
      <Box 
        sx={{ 
          flex: { xs: 1, md: '0 0 500px', lg: '0 0 600px' }, // Fix width on larger screens
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: { xs: 3, sm: 6 },
          position: 'relative'
        }}
      >
        <Container maxWidth="xs">
            {/* Logo Area - Centered & Clean */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                 <Image 
                  src="/assets/LCP_Logo.svg" 
                  alt="Labor Certification Platform" 
                  width={150} 
                  height={150}
                  style={{ width: 'auto', height: 80 }} // Constrain height, auto width
                  priority
                />
            </Box>

            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                    Welcome back
                </Typography>
                <Typography variant="body1" sx={{ color: '#64748b' }}>
                    Please enter your details to sign in
                </Typography>
            </Box>

            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  bgcolor: '#fef2f2',
                  color: '#991b1b',
                  border: '1px solid #fee2e2'
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleLogin} noValidate>
              <Stack spacing={2.5}>
                <Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#475569', fontWeight: 600 }}>Email Address</Typography>
                    <TextField
                        required
                        fullWidth
                        id="email"
                        placeholder="name@company.com"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        InputProps={{
                            startAdornment: (
                            <InputAdornment position="start">
                                <EmailIcon sx={{ color: '#cbd5e1' }} />
                            </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            bgcolor: '#f8fafc',
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                            '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 2 },
                            },
                        }}
                    />
                </Box>

                <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>Password</Typography>
                        <Link href="#" underline="hover" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                            Forgot password?
                        </Link>
                    </Stack>
                    <TextField
                        required
                        fullWidth
                        name="password"
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        InputProps={{
                            startAdornment: (
                            <InputAdornment position="start">
                                <LockIcon sx={{ color: '#cbd5e1' }} />
                            </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                            borderRadius: 1.5,
                            bgcolor: '#f8fafc',
                            '& fieldset': { borderColor: '#e2e8f0' },
                            '&:hover fieldset': { borderColor: '#cbd5e1' },
                            '&.Mui-focused fieldset': { borderColor: '#2563eb', borderWidth: 2 },
                            },
                        }}
                    />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={!loading && <ArrowForwardIcon />}
                  sx={{
                    mt: 2,
                    py: 1.75,
                    borderRadius: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    bgcolor: '#2563eb', // Primary Blue
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.1), 0 2px 4px -1px rgba(37, 99, 235, 0.06)',
                    transition: 'all 0.2s',
                    '&:hover': {
                        bgcolor: '#1d4ed8',
                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)',
                        transform: 'translateY(-1px)',
                    },
                    '&:active': {
                        transform: 'translateY(0)',
                    }
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                {/* <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Don't have an account?{' '}
                        <Link href="/register" sx={{ fontWeight: 600, textDecoration: 'none' }}>
                            Start a 14 day free trial
                        </Link>
                    </Typography>
                </Box> */}

              </Stack>
            </Box>
        </Container>
      </Box>
    </Box>
  );
}
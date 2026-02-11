'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  Paper,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Grid,
  MenuItem,
  CircularProgress
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function RegisterPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [industries, setIndustries] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [companyId, setCompanyId] = useState('');

  const [formData, setFormData] = useState({
    company_name: '',
    industry_id: '',
    address: '',
    website: '',
    supervisor_first_name: '',
    supervisor_last_name: '',
    supervisor_email: '',
    supervisor_phone: '',
    supervisor_password: '',
    confirm_password: '',
    tax_id: ''
  });

  const steps = ['Company', 'Supervisor', 'Verification'];

  useEffect(() => {
    fetchIndustries();
  }, []);

  const fetchIndustries = async () => {
    try {
      const res = await fetch('/api/v1/industries');
      const data = await res.json();
      if (data.status) setIndustries(data.data);
    } catch (err) {
      console.error('Failed to fetch industries');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      handleRegister();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleRegister = async () => {
    if (formData.supervisor_password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/v1/auth/register-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.status) {
        setSuccess(true);
        setCompanyId(data.data.companyId);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          p: 3,
        }}
      >
        <Paper
          sx={{
            p: 6,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <VerifiedUserIcon sx={{ fontSize: 80, color: '#10b981', mb: 3 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: '#1e293b' }}>
            Application Submitted!
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mb: 4 }}>
            Your company has been registered with ID: <strong>{companyId}</strong>.
            An administrator will review your application soon.
          </Typography>
          <Button
            variant="contained"
            fullWidth
            onClick={() => router.push('/login')}
            sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Elements */}
      <Box sx={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', top: '-10%', right: '-5%', width: 600, height: 600, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', filter: 'blur(100px)' }} />
        <Box sx={{ position: 'absolute', bottom: '-10%', left: '-5%', width: 500, height: 500, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)', filter: 'blur(100px)' }} />
      </Box>

      {/* Header */}
      <Box sx={{ p: { xs: 3, md: 5 }, zIndex: 1, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            color: 'white',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          Labour Certification Platform
        </Typography>
      </Box>

      {/* Form Container */}
      <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3, zIndex: 1, pb: 10 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            maxWidth: 800,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: 6,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 40px 100px rgba(0, 0, 0, 0.5)',
          }}
        >
          <Stack spacing={4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 1, textAlign: 'center' }}>
                Company Registration
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', textAlign: 'center' }}>
                Join the platform to certify and educate your workforce
              </Typography>
            </Box>

            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                '& .MuiStepLabel-label': { color: 'rgba(255, 255, 255, 0.5)' },
                '& .MuiStepLabel-label.Mui-active': { color: 'white', fontWeight: 600 },
                '& .MuiStepLabel-label.Mui-completed': { color: '#10b981' },
                '& .MuiStepIcon-root': { color: 'rgba(255, 255, 255, 0.1)' },
                '& .MuiStepIcon-root.Mui-active': { color: '#2563eb' },
                '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ borderRadius: 2, bgcolor: 'rgba(211, 47, 47, 0.1)', color: '#ff8a80' }}>{error}</Alert>}

            <Box>
              {activeStep === 0 && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      name="company_name"
                      value={formData.company_name}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      select
                      fullWidth
                      label="Industry"
                      name="industry_id"
                      value={formData.industry_id}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        },
                        '& .MuiSvgIcon-root': { color: 'white' }
                      }}
                    >
                      {industries.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://"
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      label="Office Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 1 && (
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="supervisor_first_name"
                      value={formData.supervisor_first_name}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="supervisor_last_name"
                      value={formData.supervisor_last_name}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Business Email"
                      name="supervisor_email"
                      type="email"
                      value={formData.supervisor_email}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="supervisor_phone"
                      value={formData.supervisor_phone}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Password"
                      name="supervisor_password"
                      type="password"
                      value={formData.supervisor_password}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirm_password"
                      type="password"
                      value={formData.confirm_password}
                      onChange={handleChange}
                      required
                      InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                          '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                        }
                      }}
                    />
                  </Grid>
                </Grid>
              )}

              {activeStep === 2 && (
                <Stack spacing={3}>
                  <Alert severity="info" sx={{ borderRadius: 2, bgcolor: 'rgba(2, 136, 209, 0.1)', color: '#81d4fa' }}>
                    Tax ID is required for verification and billing. You will be able to upload documents after initial setup.
                  </Alert>
                  <TextField
                    fullWidth
                    label="Tax ID / Registration Number"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ style: { color: 'rgba(255, 255, 255, 0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.1)' },
                        '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                      }
                    }}
                  />
                  <Box sx={{ p: 4, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 2, border: '1px dashed rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      Supporting documents upload is currently being enabled for your region.
                      You will get a notification via email once approved.
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0 || loading}
                startIcon={<ArrowBackIcon />}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  '&:hover': { borderColor: 'white', bgcolor: 'rgba(255, 255, 255, 0.05)' }
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
                endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardIcon />}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 4,
                  py: 1.2,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1e40af 0%, #172554 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 6px 20px 0 rgba(37, 99, 235, 0.6)',
                  }
                }}
              >
                {activeStep === steps.length - 1 ? (loading ? 'Registering...' : 'Complete Register') : 'Continue'}
              </Button>
            </Box>
          </Stack>
        </Paper>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 4, textAlign: 'center', zIndex: 1, position: 'relative' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          © 2026 Labour Certification Platform. All rights reserved.
        </Typography>
      </Box>
    </Box>

  );
}

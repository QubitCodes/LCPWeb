'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  Alert,
  MenuItem,
  CircularProgress,
  Stack,
  IconButton
} from '@mui/material';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BusinessIcon from '@mui/icons-material/Business';

export default function AddCompanyPage() {
  const router = useRouter();
  const [industries, setIndustries] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    industry_id: '',
    address: '',
    website: '',
    tax_id: '',
    contact_email: '',
    contact_phone: ''
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Not authenticated');
      setSubmitting(false);
      return;
    }


    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('industry_id', formData.industry_id);
    payload.append('address', formData.address);
    payload.append('website', formData.website);
    payload.append('tax_id', formData.tax_id);
    payload.append('contact_email', formData.contact_email);
    payload.append('contact_phone', formData.contact_phone);

    try {
      const res = await fetch('/api/v1/companies', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: payload
      });
      const data = await res.json();

      if (data.status) {
        router.push('/mui/admin/companies');
      } else {
        setError(data.message || 'Failed to create company');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 40px)', // adjust for sidebar padding if needed
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: 4,
        p: { xs: 2, md: 4 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box sx={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(37, 99, 235, 0.05)', filter: 'blur(60px)' }} />
      <Box sx={{ position: 'absolute', bottom: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.05)', filter: 'blur(60px)' }} />

      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4, zIndex: 1 }}>
        <IconButton onClick={() => router.back()} sx={{ bgcolor: 'white', shadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Add New Company
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Register a new client company on the platform
          </Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2, zIndex: 1 }}>{error}</Alert>}

      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.04)',
          zIndex: 1
        }}
      >
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <BusinessIcon sx={{ color: '#2563eb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  Basic Information
                </Typography>
              </Stack>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                label="Company Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="International Business Corp"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                required
                fullWidth
                label="Industry"
                name="industry_id"
                value={formData.industry_id}
                onChange={handleChange}
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
                label="Tax ID"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                placeholder="Tax registration number"
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
                Contact & Online Presence
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                type="email"
                label="Contact Email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Contact Phone"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Office Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={submitting}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
                }}
              >
                {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Company'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.back()}
                sx={{ px: 4, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
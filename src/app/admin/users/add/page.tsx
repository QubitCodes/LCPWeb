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
  MenuItem
} from '@mui/material';
import { useRouter } from 'next/navigation';

export default function AddUserPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'WORKER',
    company_id: '',
    phone_number: '',
    years_experience: 0
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/v1/companies');
      const data = await res.json();
      if (data.status) setCompanies(data.data);
    } catch (e) { console.error(e); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (data.status) {
        router.push('/admin/users');
      } else {
        setError(data.message || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth="md">
      <Typography variant="h4" gutterBottom>
        Create New User
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                type="email"
                label="Email Address"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                required
                fullWidth
                type="password"
                label="Password"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <MenuItem value="SUPERVISOR">Supervisor</MenuItem>
                <MenuItem value="WORKER">Worker</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                label="Company"
                name="company_id"
                value={formData.company_id}
                onChange={handleChange}
                helperText="Required for Supervisor/Worker"
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {formData.role === 'WORKER' && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Years of Experience"
                  name="years_experience"
                  value={formData.years_experience}
                  onChange={handleChange}
                />
              </Grid>
            )}

            <Grid size={{ xs: 12 }} sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                size="large"
                type="submit"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create User'}
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => router.back()}
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
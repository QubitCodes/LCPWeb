'use client';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';

export default function SupervisorDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/stats', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (data.status) setStats(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Supervisor Dashboard</Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="primary">My Workers</Typography>
            <Typography variant="h3">{stats?.workers || 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="warning.main">Pending Recommendations</Typography>
            <Typography variant="h3">{stats?.pendingRecs || 0}</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" color="success.main">Approved Levels</Typography>
            <Typography variant="h3">{stats?.approvedRecs || 0}</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
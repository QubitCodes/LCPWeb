'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Chip, Card, CardContent, CardActions, Alert, Divider
} from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningIcon from '@mui/icons-material/Warning';
import { useRouter } from 'next/navigation';

export default function WorkerDashboard() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/worker/enrollments', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.status) setEnrollments(data.data); })
      .finally(() => setLoading(false));
  }, []);

  const active = enrollments.filter(e => e.status === 'ACTIVE');
  const failed = enrollments.filter(e => e.status === 'FAILED' || e.status === 'EXPIRED');
  const completed = enrollments.filter(e => e.status === 'COMPLETED');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Learning Dashboard</Typography>

      {/* ACTIVE SECTION */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Active Courses</Typography>
      <Grid container spacing={3}>
        {active.map((enr) => (
          <Grid size={{ xs: 12, md: 4 }} key={enr.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderTop: '4px solid #1976d2' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>{enr.level?.course?.title}</Typography>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {enr.level?.title} (Level {enr.level?.level_number})
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Deadline: {new Date(enr.deadline_date).toLocaleDateString()}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Chip label="In Progress" color="primary" size="small" />
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<PlayCircleFilledIcon />}
                  onClick={() => router.push(`/admin/learning/${enr.id}`)}
                >
                  Continue Learning
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {active.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 3, bgcolor: '#f5f5f5' }}>
              <Typography color="text.secondary">No active courses. Contact your supervisor to enroll.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* FAILED / EXPIRED SECTION */}
      {failed.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }} color="error">Requires Attention</Typography>
          <Grid container spacing={3}>
            {failed.map((enr) => (
              <Grid size={{ xs: 12, md: 4 }} key={enr.id}>
                <Card sx={{ height: '100%', bgcolor: '#fff4f4', border: '1px solid #ffcdd2' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <WarningIcon color="error" />
                      <Typography variant="h6" color="error">
                        {enr.status === 'EXPIRED' ? 'Course Expired' : 'Course Failed'}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1">{enr.level?.course?.title}</Typography>
                    <Typography variant="body2">{enr.level?.title}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" display="block">
                      {enr.status === 'EXPIRED'
                        ? 'You missed the completion deadline.'
                        : 'You exceeded the maximum attempts on the final exam.'}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      fullWidth
                      color="error"
                      startIcon={<RefreshIcon />}
                      onClick={() => alert('Please ask your supervisor to purchase a new enrollment for this level.')}
                    >
                      Re-Enrollment Required
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* COMPLETED SECTION */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>Completed History</Typography>
      <Grid container spacing={3}>
        {completed.map((enr) => (
          <Grid size={{ xs: 12, md: 4 }} key={enr.id}>
            <Paper sx={{ p: 2, bgcolor: '#f0fdf4', borderLeft: '4px solid #4caf50' }}>
              <Typography variant="subtitle1">{enr.level?.course?.title}</Typography>
              <Typography variant="body2">{enr.level?.title}</Typography>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Completed on {new Date(enr.completion_date).toLocaleDateString()}
              </Typography>
              <Button
                size="small"
                sx={{ mt: 1 }}
                onClick={() => router.push('/admin/certificates')}
              >
                View Certificate
              </Button>
            </Paper>
          </Grid>
        ))}
        {completed.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" color="text.secondary">No completed courses yet.</Typography>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
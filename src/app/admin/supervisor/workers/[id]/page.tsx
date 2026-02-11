'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Divider, List, ListItem,
  ListItemText, Chip, CircularProgress, LinearProgress
} from '@mui/material';
import { useParams } from 'next/navigation';

export default function WorkerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`/api/v1/supervisor/workers/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.status) setData(resData.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <CircularProgress />;
  if (!data) return <Typography>Worker not found</Typography>;

  const { worker, enrollments } = data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{worker.first_name} {worker.last_name}</Typography>
      <Typography color="text.secondary" gutterBottom>{worker.email} • {worker.phone_number}</Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h5" gutterBottom>Enrollments & Progress</Typography>

      <Grid container spacing={3}>
        {enrollments.map((enr: any) => (
          <Grid size={{ xs: 12, md: 6 }} key={enr.id}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6">{enr.course_title}</Typography>
                <Chip label={enr.status} color={enr.status === 'COMPLETED' ? 'success' : 'primary'} size="small" />
              </Box>
              <Typography variant="subtitle2" color="text.secondary">{enr.level_title}</Typography>

              <Box sx={{ mt: 2, mb: 1 }}>
                <Typography variant="caption">Modules Completed: {enr.items_completed}</Typography>
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2 }}>Content Breakdown:</Typography>
              <List dense>
                {enr.progress_records.map((rec: any) => (
                  <ListItem key={rec.id}>
                    <ListItemText
                      primary={rec.status}
                      secondary={`Attempts: ${rec.attempts_count} | Score: ${rec.quiz_score || 0}%`}
                    />
                  </ListItem>
                ))}
                {enr.progress_records.length === 0 && <Typography variant="caption">No progress started.</Typography>}
              </List>
            </Paper>
          </Grid>
        ))}
        {enrollments.length === 0 && (
          <Grid size={{ xs: 12 }}><Typography>No active enrollments.</Typography></Grid>
        )}
      </Grid>
    </Box>
  );
}
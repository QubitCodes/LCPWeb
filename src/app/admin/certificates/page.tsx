'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Card, CardContent, CardActions
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { useRouter } from 'next/navigation';

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/worker/certificates', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => { if (data.status) setCertificates(data.data); });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>My Certificates</Typography>
      <Grid container spacing={3}>
        {certificates.map((cert) => (
          <Grid size={{ xs: 12, md: 6, lg: 4 }} key={cert.id}>
            <Card sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <WorkspacePremiumIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
                <Typography variant="h6" gutterBottom>{cert.level?.course?.title}</Typography>
                <Typography variant="subtitle1" color="primary">{cert.level?.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Issued: {new Date(cert.issue_date).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" display="block">Code: {cert.certificate_code}</Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                <Button
                  startIcon={<VisibilityIcon />}
                  variant="contained"
                  size="small"
                  onClick={() => router.push(`/admin/certificates/${cert.id}`)}
                >
                  View / Print
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {certificates.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">You haven't earned any certificates yet.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
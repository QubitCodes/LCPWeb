'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useRouter } from 'next/navigation';

export default function CertificateViewPage() {
  const { id } = useParams(); // Certificate ID
  const router = useRouter();
  const [cert, setCert] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We need to fetch the specific certificate. 
    // Reusing the list endpoint and filtering for now since we didn't build a specific GET /certificates/:id
    const token = localStorage.getItem('token');
    fetch('/api/v1/worker/certificates', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(data => { 
        if(data.status) {
           const found = data.data.find((c: any) => c.id === id);
           setCert(found);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!cert) return <Typography align="center" sx={{ mt: 10 }}>Certificate not found.</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, '@media print': { display: 'none' } }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}>Back</Button>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Print / Save PDF</Button>
      </Box>

      {/* Certificate Container */}
      <Paper 
        elevation={4}
        sx={{ 
          width: '100%', 
          maxWidth: '800px', 
          margin: '0 auto', 
          padding: '60px', 
          textAlign: 'center',
          border: '10px double #1976d2',
          backgroundImage: 'radial-gradient(circle, #fff 0%, #f8fcfd 100%)',
          '@media print': {
            boxShadow: 'none',
            border: '5px solid #000',
            width: '100%',
            height: '100vh'
          }
        }}
      >
        <Box sx={{ mb: 4 }}>
            <img src="https://via.placeholder.com/100x100?text=LOGO" alt="Company Logo" style={{ marginBottom: 20 }} />
            <Typography variant="h3" sx={{ fontFamily: 'serif', fontWeight: 'bold', color: '#333' }}>
                Certificate of Completion
            </Typography>
            <Typography variant="subtitle1" sx={{ mt: 1, letterSpacing: 2 }}>
                LMS WORKFORCE CERTIFICATION
            </Typography>
        </Box>

        <Typography variant="body1" sx={{ fontSize: '1.2rem', fontStyle: 'italic', mb: 2 }}>
            This is to certify that
        </Typography>

        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2', textTransform: 'uppercase', mb: 2, borderBottom: '2px solid #ddd', display: 'inline-block', px: 4, pb: 1 }}>
            {cert.worker?.first_name} {cert.worker?.last_name}
        </Typography>

        <Typography variant="body1" sx={{ fontSize: '1.2rem', fontStyle: 'italic', mb: 3, mt: 3 }}>
            has successfully completed the requirements for
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
            {cert.level?.course?.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 5 }}>
            {cert.level?.title}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 8, px: 4 }}>
            <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ borderTop: '1px solid #333', pt: 1, width: 200 }}>
                    Date Issued: {new Date(cert.issue_date).toLocaleDateString()}
                </Typography>
                <Typography variant="caption" display="block">
                    ID: {cert.certificate_code}
                </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ borderTop: '1px solid #333', pt: 1, width: 200 }}>
                    Authorized Signature
                </Typography>
                <Typography variant="caption" display="block">
                    LMS Director
                </Typography>
            </Box>
        </Box>
      </Paper>
    </Box>
  );
}
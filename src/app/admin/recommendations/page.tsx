'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from '@mui/material';

export default function AdminRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<any>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchRecs();
  }, []);

  const fetchRecs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/v1/recommendations', { headers: { 'Authorization': `Bearer ${token}` }});
    const data = await res.json();
    if(data.status) setRecommendations(data.data);
  };

  const handleAction = (rec: any) => {
    setSelectedRec(rec);
    setOpen(true);
  };

  const handleSubmit = async (status: 'APPROVED' | 'REJECTED') => {
    const token = localStorage.getItem('token');
    await fetch(`/api/v1/recommendations/${selectedRec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status, comment })
    });
    setOpen(false);
    setComment('');
    fetchRecs();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Pending Recommendations</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>Worker</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Recommended By</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recommendations.map((r) => (
              <TableRow key={r.id}>
                {/* Need to include Company model in backend list if not present, assuming basic fields for now */}
                <TableCell>{r.company_id}</TableCell> 
                <TableCell>{r.worker?.first_name} {r.worker?.last_name}</TableCell>
                <TableCell>{r.level?.title}</TableCell>
                <TableCell>{r.recommender?.first_name}</TableCell>
                <TableCell>{r.reason}</TableCell>
                <TableCell>
                  <Chip 
                    label={r.status} 
                    color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'} 
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {r.status === 'PENDING' && (
                    <Button size="small" variant="outlined" onClick={() => handleAction(r)}>
                      Review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {recommendations.length === 0 && <TableRow><TableCell colSpan={7} align="center">No pending recommendations.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Review Recommendation</DialogTitle>
        <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Reason: {selectedRec?.reason}
            </Typography>
            <TextField 
                label="Admin Comment" fullWidth multiline rows={3} 
                value={comment} onChange={(e) => setComment(e.target.value)} 
            />
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSubmit('REJECTED')} color="error">Reject</Button>
            <Button onClick={() => handleSubmit('APPROVED')} variant="contained" color="success">Approve</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
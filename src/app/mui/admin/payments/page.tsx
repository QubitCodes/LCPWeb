'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Link
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AttachFileIcon from '@mui/icons-material/AttachFile';

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/v1/payments/pending', { headers: { 'Authorization': `Bearer ${token}` }});
    const data = await res.json();
    if(data.status) setPayments(data.data);
  };

  const handleApprove = async (id: string) => {
    if(!confirm('Are you sure you want to approve this payment? Access will be granted.')) return;
    
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/payments/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if(data.status) {
        fetchPayments();
    } else {
        alert('Error: ' + data.message);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Pending Payment Approvals</Typography>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Ordered By</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Proof</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{p.order?.ordered_by?.first_name} {p.order?.ordered_by?.last_name}</TableCell>
                <TableCell>{p.order?.company?.name || 'Individual'}</TableCell>
                <TableCell>${p.amount}</TableCell>
                <TableCell>
                  {p.proof_document_url ? (
                    <Button 
                      startIcon={<AttachFileIcon />} 
                      size="small" 
                      href={`/api/v1/files${p.proof_document_url}`} 
                      target="_blank"
                    >
                      View
                    </Button>
                  ) : 'None'}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="contained" 
                    color="success" 
                    size="small" 
                    startIcon={<CheckCircleIcon />}
                    onClick={() => handleApprove(p.id)}
                  >
                    Approve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {payments.length === 0 && <TableRow><TableCell colSpan={6} align="center">No pending payments.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
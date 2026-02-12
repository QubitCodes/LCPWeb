'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useRouter } from 'next/navigation';

export default function SupervisorWorkersPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    phone_number: '',
    years_experience: 0
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    const userStr = localStorage.getItem('user');
    if(userStr) {
      const user = JSON.parse(userStr);
      const res = await fetch(`/api/v1/users?company_id=${user.company_id}&role=WORKER`);
      const data = await res.json();
      if(data.status) setWorkers(data.data);
    }
  };

  const handleCreate = async () => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    const user = JSON.parse(userStr || '{}');

    const payload = { ...formData, role: 'WORKER', company_id: user.company_id };

    try {
      const res = await fetch('/api/v1/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if(data.status) {
        setOpen(false);
        fetchWorkers();
        setFormData({ first_name: '', last_name: '', email: '', password: '', phone_number: '', years_experience: 0 });
      } else {
        setError(data.message);
      }
    } catch(e) { setError('Error creating worker'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">My Workers</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Worker
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Experience</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {workers.map((w) => (
              <TableRow key={w.id}>
                <TableCell>{w.first_name} {w.last_name}</TableCell>
                <TableCell>{w.email}</TableCell>
                <TableCell>{w.phone_number}</TableCell>
                <TableCell>{w.years_experience} Yrs</TableCell>
                <TableCell>
                  <Tooltip title="View Progress">
                    <IconButton color="primary" onClick={() => router.push(`/admin/supervisor/workers/${w.id}`)}>
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {workers.length === 0 && <TableRow><TableCell colSpan={5} align="center">No workers found.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add New Worker</DialogTitle>
        <DialogContent>
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: 400 }}>
             {error && <Alert severity="error">{error}</Alert>}
             <TextField label="First Name" fullWidth value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
             <TextField label="Last Name" fullWidth value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
             <TextField label="Email" fullWidth type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
             <TextField label="Password" fullWidth type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
             <TextField label="Phone" fullWidth value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} />
             <TextField label="Years Experience" fullWidth type="number" value={formData.years_experience} onChange={(e) => setFormData({...formData, years_experience: parseInt(e.target.value)})} />
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, Chip, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { useRouter } from 'next/navigation';
import CustomTable from '@/components/mui/CustomTable';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  company?: { name: string };
  created_at: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer State
  const [openTransfer, setOpenTransfer] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [targetCompany, setTargetCompany] = useState('');
  const [transferReason, setTransferReason] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/v1/users');
      const data = await res.json();
      if (data.status) setUsers(data.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const fetchCompanies = async () => {
    const res = await fetch('/api/v1/companies');
    const data = await res.json();
    if (data.status) setCompanies(data.data);
  };

  const handleOpenTransfer = (user: User) => {
    setSelectedUser(user);
    setTargetCompany('');
    setTransferReason('');
    setOpenTransfer(true);
  };

  const handleTransfer = async () => {
    if (!selectedUser) return;
    const token = localStorage.getItem('token');

    const res = await fetch('/api/v1/users/change-company', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        user_id: selectedUser.id,
        new_company_id: targetCompany,
        reason: transferReason
      })
    });

    const data = await res.json();
    if (data.status) {
      alert('User transferred successfully');
      setOpenTransfer(false);
      fetchUsers();
    } else {
      alert('Failed: ' + data.message);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'error';
      case 'ADMIN': return 'warning';
      case 'SUPERVISOR': return 'primary';
      case 'WORKER': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box>
      <CustomTable
        title="Users"
        actionButton={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/mui/admin/users/add')}
          >
            Add User
          </Button>
        }
        loading={loading}
        rows={users}
        columns={[
          { id: 'name', label: 'Name', format: (_: any, row: User) => `${row.first_name} ${row.last_name}` },
          { id: 'email', label: 'Email' },
          {
            id: 'role',
            label: 'Role',
            format: (value: string) => (
              <Chip
                label={value}
                color={getRoleColor(value) as any}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            )
          },
          { id: 'company_name', label: 'Company', format: (_: any, row: User) => row.company?.name || '-' },
          { id: 'created_at', label: 'Joined', format: (value: string) => new Date(value).toLocaleDateString() }
        ]}
        actions={(user: User) => (
          ['WORKER', 'SUPERVISOR'].includes(user.role) && (
            <Tooltip title="Transfer Company">
              <IconButton onClick={() => handleOpenTransfer(user)} size="small" color="primary">
                <SwapHorizIcon />
              </IconButton>
            </Tooltip>
          )
        )}
      />

      <Dialog open={openTransfer} onClose={() => setOpenTransfer(false)} fullWidth maxWidth="sm">
        <DialogTitle>Transfer User to Another Company</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography>
              Transferring <strong>{selectedUser?.first_name} {selectedUser?.last_name}</strong> from their current company.
            </Typography>
            <TextField
              select label="New Company" fullWidth
              value={targetCompany}
              onChange={(e) => setTargetCompany(e.target.value)}
            >
              {companies.map(c => (
                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Reason for Transfer" fullWidth multiline rows={2}
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTransfer(false)}>Cancel</Button>
          <Button onClick={handleTransfer} variant="contained">Transfer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
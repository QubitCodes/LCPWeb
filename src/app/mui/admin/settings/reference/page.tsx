'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CustomTable from '@/components/mui/CustomTable';

const REFERENCE_TYPES = [
  { id: 'industries', label: 'Industries' },
  { id: 'categories', label: 'Job Categories' },
  { id: 'skills', label: 'Skills' },
];

export default function ReferenceManagementPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentType = REFERENCE_TYPES[activeTab].id;

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reference/${currentType}`);
      const result = await res.json();
      if (result.status) {
        setData(result.data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item: any = null) => {
    setEditingItem(item);
    setFormData({
      name: item ? item.name : '',
      is_active: item ? item.is_active : true,
    });
    setError('');
    setOpenDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    setSubmitting(true);
    try {
      const method = editingItem ? 'PATCH' : 'POST';
      const url = editingItem
        ? `/api/v1/reference/${currentType}?id=${editingItem.id}`
        : `/api/v1/reference/${currentType}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.status) {
        setOpenDialog(false);
        fetchData();
      } else {
        setError(result.message || 'Operation failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/v1/reference/${currentType}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const result = await res.json();
      if (result.status) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete error');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
            Reference Data
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system-wide configuration values
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Add New
        </Button>
      </Stack>

      <Paper sx={{ borderRadius: 4, mb: 4, overflow: 'hidden' }} elevation={0}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            bgcolor: 'rgba(255, 255, 255, 0.5)',
            '& .MuiTab-root': { py: 2, fontWeight: 600, textTransform: 'none' }
          }}
        >
          {REFERENCE_TYPES.map((type) => (
            <Tab key={type.id} label={type.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 2 }}>
          <CustomTable
            title={`${REFERENCE_TYPES[activeTab].label} List`}
            loading={loading}
            rows={data}
            columns={[
              { id: 'name', label: 'Name' },
              {
                id: 'is_active',
                label: 'Status',
                format: (val: boolean) => (
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      display: 'inline-block',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      bgcolor: val ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                      color: val ? '#059669' : '#475569',
                    }}
                  >
                    {val ? 'ACTIVE' : 'INACTIVE'}
                  </Box>
                )
              },
              {
                id: 'created_at',
                label: 'Created At',
                format: (val: string) => new Date(val).toLocaleDateString()
              }
            ]}
            actions={(row: any) => (
              <Stack direction="row" spacing={1}>
                <IconButton size="small" color="primary" onClick={() => handleOpenDialog(row)}>
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Stack>
            )}
          />
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => !submitting && setOpenDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingItem ? 'Edit Item' : `Add New ${REFERENCE_TYPES[activeTab].label.slice(0, -1)}`}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              autoFocus
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active Status"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {editingItem ? 'Save Changes' : 'Create Item'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

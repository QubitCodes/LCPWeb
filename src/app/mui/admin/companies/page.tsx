'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
  company_id: string;
  status: string;
  created_at: string;
}

import CustomTable from '@/components/mui/CustomTable';

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  // Bulk Import State
  const [openImport, setOpenImport] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ message: string, success: boolean } | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/v1/companies');
      const data = await res.json();
      if (data.status) {
        setCompanies(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/v1/companies/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.status) {
        setImportResult({ message: data.message, success: true });
        fetchCompanies();
      } else {
        setImportResult({ message: data.message || 'Import failed', success: false });
      }
    } catch (err) {
      setImportResult({ message: 'Network error occurred', success: false });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <CustomTable
        title="Companies"
        actionButton={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<UploadFileIcon />}
              onClick={() => {
                setOpenImport(true);
                setImportResult(null);
                setFile(null);
              }}
            >
              Bulk Import
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => router.push('/mui/admin/companies/add')}
            >
              Add Company
            </Button>
          </Stack>
        }
        loading={loading}
        rows={companies}
        columns={[
          { id: 'name', label: 'Company Name' },
          { id: 'company_id', label: 'Company ID', format: (value: string) => value || 'N/A' },
          {
            id: 'status',
            label: 'Status',
            format: (value: string) => (
              <Chip
                label={value}
                color={value === 'ACTIVE' ? 'success' : 'default'}
                size="small"
                sx={{ fontWeight: 500 }}
              />
            )
          },
          { id: 'created_at', label: 'Registered On', format: (value: string) => new Date(value).toLocaleDateString() }
        ]}
        actions={(row: any) => (
          <Button size="small" variant="text" color="primary">Edit</Button>
        )}
      />

      {/* Bulk Import Dialog */}
      <Dialog open={openImport} onClose={() => !importing && setOpenImport(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Import Companies</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Upload a CSV file containing company data. Headers should include:
              <strong> name, industry_id, website, tax_id, address, contact_email, contact_phone</strong>.
            </Typography>

            <Box
              sx={{
                p: 4,
                border: '2px dashed #cbd5e1',
                borderRadius: 2,
                textAlign: 'center',
                bgcolor: '#f8fafc'
              }}
            >
              <input
                type="file"
                accept=".csv"
                style={{ display: 'none' }}
                id="bulk-csv-input"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="bulk-csv-input">
                <Button component="span" variant="contained" color="inherit" sx={{ bgcolor: 'white', mb: 1 }}>
                  Select CSV File
                </Button>
              </label>
              {file && (
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                  Selected: {file.name}
                </Typography>
              )}
            </Box>

            {importResult && (
              <Alert severity={importResult.success ? 'success' : 'error'}>
                {importResult.message}
              </Alert>
            )}

            {importing && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2">Processing your file...</Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenImport(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            variant="contained"
            disabled={!file || importing}
            startIcon={importing ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Start Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
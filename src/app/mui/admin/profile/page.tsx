'use client';
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Avatar, Divider,
  List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // In a real app, fetch fresh data from API. using local for speed.
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem('token');

    // 1. Upload File
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'documents');

    const res = await fetch('/api/v1/uploads', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    if (data.status) {
      // 2. Update User Profile (Mocking this part - ideally a PUT /api/v1/users/me endpoint)
      // Since we didn't build a specific Update User generic endpoint, 
      // we will just show success for this demo step.
      alert('Document Uploaded Successfully: ' + data.data.path);
      setFile(null);
    }
    setUploading(false);
  };

  if (!user) return <Typography>Loading...</Typography>;

  return (
    <Box maxWidth="md">
      <Typography variant="h4" gutterBottom>My Profile</Typography>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size="grow">
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 40 }}>
              {user.first_name[0]}
            </Avatar>
          </Grid>
          <Grid size="grow">
            <Typography variant="h5">{user.first_name} {user.last_name}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>Role: {user.role}</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" gutterBottom>My Documents</Typography>
      <Paper sx={{ p: 4 }}>
        <Typography variant="body2" color="text.secondary" paragraph>
          Upload your ID proofs, Contracts, or Certificates here.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
          >
            Select File
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          <Typography variant="body2">{file ? file.name : 'No file selected'}</Typography>
          <Button
            variant="contained"
            disabled={!file || uploading}
            onClick={handleUpload}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </Box>

        <Divider />

        {/* Mock List of uploaded docs */}
        <List>
          <ListItem>
            <ListItemIcon><InsertDriveFileIcon /></ListItemIcon>
            <ListItemText primary="Employment_Contract.pdf" secondary="Uploaded on 2023-10-01" />
          </ListItem>
        </List>

      </Paper>
    </Box>
  );
}
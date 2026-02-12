'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  
  // Form State
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  
  // Data derived from selections
  const [levels, setLevels] = useState<any[]>([]);

  useEffect(() => {
    fetchEnrollments();
    fetchDropdowns();
  }, []);

  const fetchEnrollments = async () => {
    const res = await fetch('/api/v1/orders'); // GET returns enrollments list
    const data = await res.json();
    if(data.status) setEnrollments(data.data);
  };

  const fetchDropdowns = async () => {
    const [wRes, jRes] = await Promise.all([
      fetch('/api/v1/users?role=WORKER'),
      fetch('/api/v1/jobs')
    ]);
    const wData = await wRes.json();
    const jData = await jRes.json();
    if(wData.status) setWorkers(wData.data);
    if(jData.status) setJobs(jData.data);
  };

  const handleJobChange = async (jobId: string) => {
    setSelectedJob(jobId);
    // Fetch course details to get levels
    const job = jobs.find(j => j.id === jobId);
    if(job && job.course) {
      const res = await fetch(`/api/v1/courses/${job.course.id}`);
      const data = await res.json();
      if(data.status) setLevels(data.data.levels);
    } else {
      setLevels([]);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    // Mock price of $50 per level
    const payload = {
      items: [
        { worker_id: selectedWorker, course_level_id: selectedLevel, price: 50.00 }
      ]
    };

    const res = await fetch('/api/v1/orders', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if(data.status) {
      setOpen(false);
      fetchEnrollments();
      alert('Enrollment Successful!');
    } else {
      alert('Failed: ' + data.message);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Active Enrollments</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          New Enrollment
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Worker</TableCell>
              <TableCell>Course Level</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>Deadline</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {enrollments.map((enr) => (
              <TableRow key={enr.id}>
                <TableCell>{enr.worker?.first_name} {enr.worker?.last_name}</TableCell>
                <TableCell>{enr.level?.title} (L{enr.level?.level_number})</TableCell>
                <TableCell>{new Date(enr.start_date).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(enr.deadline_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Chip label={enr.status} color="success" size="small" />
                </TableCell>
              </TableRow>
            ))}
            {enrollments.length === 0 && (
               <TableRow><TableCell colSpan={5} align="center">No active enrollments.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Enroll Worker</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              select label="Select Worker" fullWidth 
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
            >
              {workers.map(w => (
                <MenuItem key={w.id} value={w.id}>{w.first_name} {w.last_name}</MenuItem>
              ))}
            </TextField>
             <TextField 
              select label="Select Job/Course" fullWidth 
              value={selectedJob}
              onChange={(e) => handleJobChange(e.target.value)}
            >
              {jobs.map(j => (
                <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>
              ))}
            </TextField>
            <TextField 
              select label="Select Level" fullWidth 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              disabled={!selectedJob}
            >
              {levels.map(l => (
                <MenuItem key={l.id} value={l.id}>Level {l.level_number}: {l.title}</MenuItem>
              ))}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              Note: This will simulate a payment of $50.00
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">Pay & Enroll</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

export default function SupervisorRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  
  // Data for Form
  const [workers, setWorkers] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  
  const [selectedWorker, setSelectedWorker] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchRecs();
    loadDropdowns();
  }, []);

  const fetchRecs = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/v1/recommendations', { headers: { 'Authorization': `Bearer ${token}` }});
    const data = await res.json();
    if(data.status) setRecommendations(data.data);
  };

  const loadDropdowns = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const [wRes, jRes] = await Promise.all([
      fetch(`/api/v1/users?company_id=${user.company_id}&role=WORKER`),
      fetch('/api/v1/jobs')
    ]);
    const wData = await wRes.json();
    const jData = await jRes.json();
    if(wData.status) setWorkers(wData.data);
    if(jData.status) setJobs(jData.data);
  };

  const handleJobChange = async (jobId: string) => {
    setSelectedJob(jobId);
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
    const payload = {
        worker_id: selectedWorker,
        course_level_id: selectedLevel,
        reason
    };

    await fetch('/api/v1/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    setOpen(false);
    fetchRecs();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Level Recommendations</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          New Recommendation
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Worker</TableCell>
              <TableCell>Recommended Level</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Admin Comment</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {recommendations.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.worker?.first_name} {r.worker?.last_name}</TableCell>
                <TableCell>{r.level?.title} (L{r.level?.level_number})</TableCell>
                <TableCell>{r.reason}</TableCell>
                <TableCell>
                  <Chip 
                    label={r.status} 
                    color={r.status === 'APPROVED' ? 'success' : r.status === 'REJECTED' ? 'error' : 'warning'} 
                    size="small"
                  />
                </TableCell>
                <TableCell>{r.admin_comment || '-'}</TableCell>
              </TableRow>
            ))}
            {recommendations.length === 0 && <TableRow><TableCell colSpan={5} align="center">No recommendations sent.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Recommend Worker for Level</DialogTitle>
        <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField select label="Worker" fullWidth value={selectedWorker} onChange={(e) => setSelectedWorker(e.target.value)}>
                    {workers.map(w => <MenuItem key={w.id} value={w.id}>{w.first_name} {w.last_name}</MenuItem>)}
                </TextField>
                <TextField select label="Course" fullWidth value={selectedJob} onChange={(e) => handleJobChange(e.target.value)}>
                    {jobs.map(j => <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>)}
                </TextField>
                <TextField select label="Level" fullWidth value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} disabled={!selectedJob}>
                    {levels.map(l => <MenuItem key={l.id} value={l.id}>{l.title}</MenuItem>)}
                </TextField>
                <TextField label="Reason" multiline rows={3} fullWidth value={reason} onChange={(e) => setReason(e.target.value)} />
            </Box>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
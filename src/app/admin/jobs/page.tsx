'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useRouter } from 'next/navigation';

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/v1/jobs')
      .then(res => res.json())
      .then(data => { if (data.status) setJobs(data.data); });
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Jobs</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => router.push('/admin/jobs/add')}
        >
          Add Job
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Job Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Course Status</TableCell>
              <TableCell>Skills</TableCell>
              <TableCell align="right">LMS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>{job.name}</TableCell>
                <TableCell>{job.category?.name || 'Uncategorized'}</TableCell>
                <TableCell>
                  {job.course ? (
                    <Chip label="Active" color="success" size="small" />
                  ) : (
                    <Chip label="No Course" color="error" size="small" />
                  )}
                </TableCell>
                <TableCell>{job.skills?.length || 0}</TableCell>
                <TableCell align="right">
                  {job.course && (
                    <Tooltip title="Manage Course Content">
                      <IconButton 
                        color="primary"
                        onClick={() => router.push(`/admin/courses/${job.course.id}`)}
                      >
                        <MenuBookIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
             {jobs.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center">No jobs found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
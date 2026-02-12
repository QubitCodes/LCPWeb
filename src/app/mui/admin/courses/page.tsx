'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, Stack 
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useRouter } from 'next/navigation';

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/courses')
      .then(res => res.json())
      .then(data => { 
        if (data.status) setCourses(data.data); 
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Courses</Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Course Title</TableCell>
              <TableCell>Linked Job</TableCell>
              <TableCell>Modules</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id} hover>
                <TableCell sx={{ fontWeight: 600 }}>{course.title}</TableCell>
                <TableCell>{course.job?.name || 'Unknown'}</TableCell>
                <TableCell>{course.levels?.length || 0} Levels</TableCell>
                <TableCell>
                  {course.is_active ? (
                    <Chip label="Active" color="success" size="small" variant="outlined" />
                  ) : (
                    <Chip label="Inactive" color="default" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Manage Content">
                    <IconButton 
                      color="primary"
                      onClick={() => router.push(`/admin/courses/${course.id}`)}
                    >
                      <MenuBookIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
             {!loading && courses.length === 0 && (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No courses found</TableCell></TableRow>
            )}
            {loading && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Loading courses...</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

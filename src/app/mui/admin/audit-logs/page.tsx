'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, Collapse, IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

function Row(props: { row: any }) {
  const { row } = props;
  const [open, setOpen] = useState(false);

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {new Date(row.created_at).toLocaleString()}
        </TableCell>
        <TableCell>{row.actor ? `${row.actor.first_name} ${row.actor.last_name}` : 'System'}</TableCell>
        <TableCell>{row.actor?.role || '-'}</TableCell>
        <TableCell>
            <Chip label={row.action} color="primary" variant="outlined" size="small" />
        </TableCell>
        <TableCell>{row.entity_type} {row.entity_id ? `(${row.entity_id.substring(0,8)}...)` : ''}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="caption" gutterBottom component="div">
                Details (JSON)
              </Typography>
              <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                  <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                      {JSON.stringify(row.details, null, 2)}
                  </pre>
              </Paper>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/v1/audit-logs', { headers: { 'Authorization': `Bearer ${token}` }})
      .then(res => res.json())
      .then(data => { if(data.status) setLogs(data.data); });
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>System Audit Logs</Typography>
      <TableContainer component={Paper}>
        <Table aria-label="collapsible table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Timestamp</TableCell>
              <TableCell>Actor</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Target</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => (
              <Row key={log.id} row={log} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
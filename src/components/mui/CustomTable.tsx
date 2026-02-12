'use client';

import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Box, 
  Typography,
  Skeleton
} from '@mui/material';
import { alpha } from '@mui/material/styles';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any, row?: any) => React.ReactNode;
}

interface CustomTableProps {
  columns: Column[];
  rows: any[];
  loading?: boolean;
  actions?: (row: any) => React.ReactNode;
  title?: string;
  actionButton?: React.ReactNode;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function CustomTable({ 
  columns, 
  rows, 
  loading = false, 
  actions,
  title,
  actionButton,
  onSearch,
  searchPlaceholder = "Search..."
}: CustomTableProps) {
  
  return (
    <Box>
      <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
      }}>
        <Box>
            {title && <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>}
            {/* Optional subheader could go here */}
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {onSearch && (
                 <Paper
                    elevation={0}
                    sx={{
                        p: '2px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        width: 250,
                        border: '1px solid #e2e8f0',
                        borderRadius: 2
                    }}
                >
                    <input
                        placeholder={searchPlaceholder}
                        style={{ outline: 'none', border: 'none', width: '100%', padding: '8px', fontSize: '0.9rem' }}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </Paper>
            )}
            {actionButton}
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: 'none', borderRadius: 3, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.03)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: '#f8fafc' }}>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{ 
                      fontWeight: 600, 
                      color: '#64748b', 
                      py: 2, 
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b', py: 2, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
               // Loading Skeletons
               Array.from(new Array(5)).map((_, index) => (
                 <TableRow key={index}>
                    {columns.map((col) => (
                        <TableCell key={col.id}><Skeleton /></TableCell>
                    ))}
                    {actions && <TableCell><Skeleton /></TableCell>}
                 </TableRow>
               ))
            ) : rows.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={columns.length + (actions ? 1 : 0)} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No data found</Typography>
                    </TableCell>
                </TableRow>
            ) : (
              rows.map((row, index) => {
                return (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id || index} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    {columns.map((column) => {
                      const value = row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format ? column.format(value, row) : value}
                        </TableCell>
                      );
                    })}
                    {actions && (
                        <TableCell align="right">
                            {actions(row)}
                        </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

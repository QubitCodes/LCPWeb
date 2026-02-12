'use client';

import React from 'react';
import { 
  Box, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider, 
  Typography,
  Stack,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Button
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import PaymentIcon from '@mui/icons-material/Payment';
import RecommendIcon from '@mui/icons-material/Recommend';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import HistoryIcon from '@mui/icons-material/History';
import CodeIcon from '@mui/icons-material/Code';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import { alpha } from '@mui/material/styles';

const drawerWidth = 260;

// Dark Sidebar Colors
const SIDEBAR_BG = '#0f172a'; // Slate 900
const SIDEBAR_TEXT = '#94a3b8'; // Slate 400
const SIDEBAR_TEXT_ACTIVE = '#ffffff';
const SIDEBAR_ACTIVE_BG = '#2563eb'; // Bright Blue (Primary)

interface SidebarProps {
  role: string;
  userName: string;
  onLogout: () => void;
}

export default function Sidebar({ role, userName, onLogout }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
  const isSupervisor = role === 'SUPERVISOR';
  const isWorker = role === 'WORKER';

  const navigate = (path: string) => {
    router.push(path);
  };

  const isActive = (path: string) => pathname === path;

  // Render a list item with consistent styling
  const renderNavItem = (text: string, icon: React.ReactNode, path: string, isBeta: boolean = false) => (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <ListItemButton 
        onClick={() => navigate(path)}
        sx={{
          mx: 2,
          my: 0,
          py: isActive(path) ? 0.75 : 0,
          borderRadius: 2,
          color: isActive(path) ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
          bgcolor: isActive(path) ? SIDEBAR_ACTIVE_BG : 'transparent',
          '&:hover': {
            bgcolor: isActive(path) ? SIDEBAR_ACTIVE_BG : alpha(SIDEBAR_TEXT, 0.08),
            color: SIDEBAR_TEXT_ACTIVE,
            '& .MuiListItemIcon-root': {
                color: SIDEBAR_TEXT_ACTIVE,
            }
          },
          transition: 'all 0.2s',
        }}
      >
        <ListItemIcon 
            sx={{ 
                minWidth: 40, 
                color: isActive(path) ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                transition: 'color 0.2s' 
            }}
        >
            {icon}
        </ListItemIcon>
        <ListItemText 
            primary={
                <Stack direction="row" alignItems="center" spacing={1}>
                    <span>{text}</span>
                    {isBeta && (
                        <Box sx={{ 
                            px: 0.8, 
                            py: 0.2, 
                            bgcolor: '#3b82f6', 
                            color: 'white', 
                            fontSize: '0.6rem', 
                            borderRadius: 1,
                            fontWeight: 700,
                            lineHeight: 1
                        }}>
                            BETA
                        </Box>
                    )}
                </Stack>
            } 
            primaryTypographyProps={{ 
                fontSize: '0.9rem', 
                fontWeight: isActive(path) ? 600 : 500,
                fontFamily: '"Inter", sans-serif'
            }} 
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            bgcolor: SIDEBAR_BG,
            color: 'white',
            borderRight: 'none',
        },
      }}
    >
      {/* Logo Area */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
         <Stack direction="row" alignItems="center" spacing={1.5}>
            {/* New Logo: Image */}
            <Box sx={{ 
                width: '100%',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
            }}>
                <Image 
                    src="/assets/LCP_Logo.svg" 
                    alt="LCP Logo" 
                    width={200} 
                    height={200}
                    style={{ width: '100%', height: 'auto' }}
                />
            </Box>
         </Stack>
         
         {/* Notification Icon (Moved here) */}
         <IconButton 
            size="small"
            sx={{ color: SIDEBAR_TEXT, '&:hover': { color: 'white' } }}
          >
             <Badge variant="dot" color="error" overlap="circular" sx={{ '& .MuiBadge-badge': { top: 3, right: 3 } }}>
                <NotificationsIcon fontSize="small" />
             </Badge>
          </IconButton>
      </Box>

      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
        <List>
            <Typography variant="caption" sx={{ px: 3, mb: 1.5, display: 'block', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 0.5 }}>
                CONTROL CENTER
            </Typography>

          {/* Dashboard Redirects */}
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton 
                onClick={() => {
                  if(isAdmin) navigate('/mui/admin/dashboard');
                  else if(isSupervisor) navigate('/mui/admin/supervisor');
                  else navigate('/mui/admin/worker');
                }}
                sx={{
                  mx: 2,
                  my: 0,
                  py: (pathname.endsWith('/mui/admin/dashboard') || pathname.endsWith('/mui/admin/supervisor') || pathname.endsWith('/mui/admin/worker')) ? 0.75 : 0,
                  borderRadius: 2,
                  color: (pathname.endsWith('/mui/admin/dashboard') || pathname.endsWith('/mui/admin/supervisor') || pathname.endsWith('/mui/admin/worker')) ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT,
                  bgcolor: (pathname.endsWith('/mui/admin/dashboard') || pathname.endsWith('/mui/admin/supervisor') || pathname.endsWith('/mui/admin/worker')) ? SIDEBAR_ACTIVE_BG : 'transparent',
                   '&:hover': {
                    bgcolor: (pathname.endsWith('/mui/admin/dashboard') || pathname.endsWith('/mui/admin/supervisor') || pathname.endsWith('/mui/admin/worker')) ? SIDEBAR_ACTIVE_BG : alpha(SIDEBAR_TEXT, 0.08),
                    color: SIDEBAR_TEXT_ACTIVE
                   }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Overview" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
              </ListItemButton>
            </ListItem>
            
          {/* Admin Links */}
          {isAdmin && (
            <>
              {renderNavItem('Companies', <WorkIcon />, '/mui/admin/companies')}
              {renderNavItem('Users', <PersonIcon />, '/mui/admin/users')}
              {renderNavItem('Jobs', <PeopleIcon />, '/mui/admin/jobs', true)}
              {renderNavItem('Courses', <SchoolIcon />, '/mui/admin/courses', true)}
              {role === 'SUPER_ADMIN' && renderNavItem('Payments', <AttachMoneyIcon />, '/mui/admin/payments')}
              {role === 'SUPER_ADMIN' && renderNavItem('Approvals', <RecommendIcon />, '/mui/admin/recommendations')}
              {renderNavItem('Audit Logs', <HistoryIcon />, '/mui/admin/audit-logs')}
              
              <Typography variant="caption" sx={{ px: 3, mt: 2, mb: 1, display: 'block', color: '#64748b', fontWeight: 700, fontSize: '0.75rem', letterSpacing: 0.5 }}>
                  SETTINGS
              </Typography>
              
              {renderNavItem('Platform Settings', <SettingsIcon />, '/mui/admin/settings/reference')}
              {/* <Box sx={{ px: 2, mt: 1 }}>
                <Button
                    onClick={() => navigate('/mui/admin/settings/reference')}
                    fullWidth
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    sx={{
                        bgcolor: '#3b82f6', // Bright Blue
                        color: 'white',
                        borderRadius: 10, // Pill shape
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)',
                        '&:hover': {
                            bgcolor: '#2563eb',
                            boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.6)',
                        }
                    }}
                >
                    Platform Settings
                </Button>
              </Box> */}
            </>
          )}

          {/* Supervisor Links */}
          {isSupervisor && (
            <>
              {renderNavItem('My Workers', <AssignmentIndIcon />, '/mui/admin/supervisor/workers')}
              {renderNavItem('Recommendations', <RecommendIcon />, '/mui/admin/supervisor/recommendations')}
              {renderNavItem('Enrollments', <PaymentIcon />, '/mui/admin/enrollments')}
            </>
          )}

          {/* Shared Links (Admin also sees enrollments) */}
          {role === 'SUPER_ADMIN' && renderNavItem('Enrollments', <PaymentIcon />, '/mui/admin/enrollments')}
          

        </List>
      </Box>

      {/* User Profile Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: alpha(SIDEBAR_TEXT, 0.1) }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: SIDEBAR_ACTIVE_BG, fontSize: '0.8rem' }}>
            {userName ? userName.charAt(0) : 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
             <Typography variant="subtitle2" noWrap sx={{ color: 'white', fontWeight: 600 }}>
                {userName || 'User'}
             </Typography>
             <Typography variant="caption" noWrap sx={{ color: SIDEBAR_TEXT }}>
                {role.replace('_', ' ')}
             </Typography>
          </Box>
          
          
          <IconButton 
            onClick={handleClick}
            size="small"
            sx={{ color: SIDEBAR_TEXT, '&:hover': { color: 'white' } }}
          >
            <MoreVertIcon />
          </IconButton>
        </Stack>
        
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: -1,
              bgcolor: SIDEBAR_BG,
              color: SIDEBAR_TEXT,
              border: `1px solid ${alpha(SIDEBAR_TEXT, 0.1)}`,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
        >
          <MenuItem onClick={() => { handleClose(); navigate('/mui/admin/profile'); }}>
            <ListItemIcon><AccountCircleIcon fontSize="small" sx={{ color: SIDEBAR_TEXT }} /></ListItemIcon>
            My Profile
          </MenuItem>
          {role === 'SUPER_ADMIN' && (
            <MenuItem onClick={() => { handleClose(); window.open('/api/docs', '_blank'); }}>
                <ListItemIcon><CodeIcon fontSize="small" sx={{ color: SIDEBAR_TEXT }} /></ListItemIcon>
                API Docs
            </MenuItem>
          )}
          <Divider sx={{ borderColor: alpha(SIDEBAR_TEXT, 0.1) }} />
          <MenuItem onClick={onLogout} sx={{ color: '#ef4444' }}>
            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
            Logout
          </MenuItem>
        </Menu>

        {/* Developer Credit */}
        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: alpha(SIDEBAR_TEXT, 0.5), fontSize: '0.65rem' }}>
          Developed by <span style={{ color: SIDEBAR_TEXT_ACTIVE, cursor: 'pointer' }} onClick={() => window.open('https://qubit.codes', '_blank')}>Qubit Codes</span>
        </Typography>
      </Box>
    </Drawer>
  );
}

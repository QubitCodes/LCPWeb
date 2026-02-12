'use client';
import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Paper, Tabs, Tab, CircularProgress, 
  List, ListItem, ListItemText, ListItemIcon, Divider,
  Dialog, DialogTitle, DialogContent, TextField, DialogActions, MenuItem,
  IconButton, Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel,
  Chip
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useParams } from 'next/navigation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && (
        <Box sx={{ p: 3 }}>{children}</Box>
      )}
    </div>
  );
}

export default function CourseDetailsPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Add/Edit Content Dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState('');
  const [contentForm, setContentForm] = useState({
    title: '',
    type: 'VIDEO',
    video_url: '',
    passing_score: 70
  });

  // Quiz Management State
  const [openQuizDialog, setOpenQuizDialog] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  
  const [newQText, setNewQText] = useState('');
  const [newQPoints, setNewQPoints] = useState(1);
  const [newQOptions, setNewQOptions] = useState([
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ]);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await fetch(`/api/v1/courses/${id}`);
      const data = await res.json();
      if (data.status) setCourse(data.data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setContentForm({ title: '', type: 'VIDEO', video_url: '', passing_score: 70 });
    setOpenDialog(true);
  };

  const openEditDialog = (item: any) => {
    setIsEditing(true);
    setEditId(item.id);
    setContentForm({
        title: item.title,
        type: item.type,
        video_url: item.video_url || '',
        passing_score: item.passing_score || 70
    });
    setOpenDialog(true);
  };

  const handleSaveContent = async () => {
    const token = localStorage.getItem('token');
    
    if (isEditing) {
        // Edit Logic
        const payload = {
            title: contentForm.title,
            video_url: contentForm.type === 'VIDEO' ? contentForm.video_url : undefined,
            passing_score: contentForm.type === 'QUESTIONNAIRE' ? contentForm.passing_score : undefined
        };
        await fetch(`/api/v1/content/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
    } else {
        // Add Logic
        const currentLevel = course.levels[tabValue];
        const payload = {
          course_level_id: currentLevel.id,
          ...contentForm,
          video_duration_seconds: contentForm.type === 'VIDEO' ? 600 : undefined,
          is_final_exam: false 
        };
        await fetch('/api/v1/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
    }

    setOpenDialog(false);
    fetchCourse();
  };

  const handleDeleteContent = async (itemId: string) => {
    if(!confirm('Are you sure you want to delete this item?')) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/v1/content/${itemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if(res.ok) fetchCourse();
  };

  const handleManageQuiz = async (contentId: string) => {
    setSelectedQuizId(contentId);
    setOpenQuizDialog(true);
    fetchQuestions(contentId);
  };

  const fetchQuestions = async (contentId: string) => {
    const res = await fetch(`/api/v1/content/${contentId}/questions`);
    const data = await res.json();
    if(data.status) setQuestions(data.data);
  };

  const handleOptionChange = (index: number, field: string, value: any) => {
    const opts = [...newQOptions];
    // @ts-ignore
    opts[index][field] = value;
    if(field === 'is_correct' && value === true) {
       opts.forEach((o, i) => { if(i !== index) o.is_correct = false; });
    }
    setNewQOptions(opts);
  };

  const handleAddQuestion = async () => {
    const token = localStorage.getItem('token');
    const payload = {
      text: newQText,
      type: 'MCQ',
      points: newQPoints,
      options: newQOptions
    };

    const res = await fetch(`/api/v1/content/${selectedQuizId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if(data.status) {
      setNewQText('');
      setNewQOptions([{ text: '', is_correct: false }, { text: '', is_correct: false }]);
      fetchQuestions(selectedQuizId);
    } else {
      alert('Error: ' + data.message);
    }
  };

  if (loading) return <CircularProgress />;
  if (!course) return <Typography>Course not found</Typography>;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{course.title}</Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Manage levels and content for this certification.
      </Typography>

      <Paper sx={{ mt: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)}
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          {course.levels.map((lvl: any) => (
            <Tab key={lvl.id} label={`Level ${lvl.level_number}`} />
          ))}
        </Tabs>

        {course.levels.map((lvl: any, index: number) => (
          <CustomTabPanel key={lvl.id} value={tabValue} index={index}>
             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{lvl.title}</Typography>
                <Button 
                  startIcon={<AddIcon />} 
                  variant="contained" 
                  size="small"
                  onClick={openAddDialog}
                >
                  Add Content
                </Button>
             </Box>
             
             {lvl.contents.length === 0 ? (
               <Typography color="text.secondary">No content in this level yet.</Typography>
             ) : (
               <List>
                 {lvl.contents.map((item: any) => (
                   <React.Fragment key={item.id}>
                     <ListItem
                       secondaryAction={
                         <Box>
                           {item.type === 'QUESTIONNAIRE' && (
                             <Button 
                               startIcon={<SettingsIcon />} 
                               onClick={() => handleManageQuiz(item.id)}
                               sx={{ mr: 1 }}
                             >
                               Questions
                             </Button>
                           )}
                           <IconButton color="primary" onClick={() => openEditDialog(item)}>
                               <EditIcon />
                           </IconButton>
                           <IconButton color="error" onClick={() => handleDeleteContent(item.id)}>
                             <DeleteIcon />
                           </IconButton>
                         </Box>
                       }
                     >
                       <ListItemIcon>
                         {item.type === 'VIDEO' ? <PlayCircleOutlineIcon /> : <QuizIcon />}
                       </ListItemIcon>
                       <ListItemText 
                         primary={item.title} 
                         secondary={`${item.type} • Order: ${item.sequence_order}`} 
                       />
                     </ListItem>
                     <Divider />
                   </React.Fragment>
                 ))}
               </List>
             )}
          </CustomTabPanel>
        ))}
      </Paper>

      {/* Add/Edit Content Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Edit Content' : 'Add Content'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label="Title" fullWidth 
              value={contentForm.title}
              onChange={(e) => setContentForm({...contentForm, title: e.target.value})}
            />
            <TextField 
              select label="Type" fullWidth 
              value={contentForm.type}
              onChange={(e) => setContentForm({...contentForm, type: e.target.value})}
              disabled={isEditing} // Cannot change type after creation
            >
              <MenuItem value="VIDEO">Video</MenuItem>
              <MenuItem value="QUESTIONNAIRE">Questionnaire</MenuItem>
            </TextField>
            
            {contentForm.type === 'VIDEO' && (
              <TextField 
                label="Video URL" fullWidth 
                value={contentForm.video_url}
                onChange={(e) => setContentForm({...contentForm, video_url: e.target.value})}
              />
            )}
            
            {contentForm.type === 'QUESTIONNAIRE' && (
               <TextField 
                type="number" label="Passing Score" fullWidth 
                value={contentForm.passing_score}
                onChange={(e) => setContentForm({...contentForm, passing_score: parseInt(e.target.value)})}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveContent} variant="contained">{isEditing ? 'Save Changes' : 'Add'}</Button>
        </DialogActions>
      </Dialog>

      {/* Manage Quiz Dialog - (Same as before) */}
      <Dialog open={openQuizDialog} onClose={() => setOpenQuizDialog(false)} fullWidth maxWidth="md">
        <DialogTitle>Manage Questions</DialogTitle>
        <DialogContent>
           <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Typography variant="h6">Existing Questions</Typography>
              {questions.map((q, idx) => (
                <Accordion key={q.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>{idx + 1}. {q.text} ({q.points} pts)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {q.options.map((opt: any) => (
                        <ListItem key={opt.id}>
                          <ListItemIcon>
                            <Checkbox checked={opt.is_correct} disabled />
                          </ListItemIcon>
                          <ListItemText primary={opt.text} />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>
              ))}
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6">Add New Question</Typography>
              <TextField 
                label="Question Text" fullWidth 
                value={newQText} onChange={(e) => setNewQText(e.target.value)}
              />
              <TextField 
                type="number" label="Points" fullWidth 
                value={newQPoints} onChange={(e) => setNewQPoints(parseInt(e.target.value))}
              />
              <Typography variant="subtitle2" sx={{ mt: 1 }}>Options</Typography>
              {newQOptions.map((opt, idx) => (
                <Box key={idx} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Checkbox 
                    checked={opt.is_correct} 
                    onChange={(e) => handleOptionChange(idx, 'is_correct', e.target.checked)}
                  />
                  <TextField 
                    fullWidth size="small" placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, 'text', e.target.value)}
                  />
                </Box>
              ))}
              <Button size="small" onClick={() => setNewQOptions([...newQOptions, { text: '', is_correct: false }])}>
                Add Option
              </Button>
           </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQuizDialog(false)}>Close</Button>
          <Button onClick={handleAddQuestion} variant="contained">Save Question</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
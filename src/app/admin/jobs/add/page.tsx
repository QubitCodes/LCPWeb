'use client';
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Paper, TextField, Grid, Alert,
  MenuItem, Chip, Stack, IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useRouter } from 'next/navigation';

export default function AddJobPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [skillsList, setSkillsList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    description: '',
  });

  // Local state for skill selection
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('BASIC');
  const [addedSkills, setAddedSkills] = useState<any[]>([]);

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Fetch dropdown data
    Promise.all([
      fetch('/api/v1/categories').then(res => res.json()),
      fetch('/api/v1/skills').then(res => res.json())
    ]).then(([catRes, skillRes]) => {
      if (catRes.status) setCategories(catRes.data);
      if (skillRes.status) setSkillsList(skillRes.data);
    });
  }, []);

  const handleAddSkill = () => {
    if (!selectedSkillId) return;
    const skillObj = skillsList.find(s => s.id === selectedSkillId);
    if (!skillObj) return;

    // Prevent duplicates
    if (addedSkills.some(s => s.skill_id === selectedSkillId)) return;

    setAddedSkills([...addedSkills, {
      skill_id: selectedSkillId,
      name: skillObj.name,
      level: selectedLevel
    }]);
    setSelectedSkillId('');
  };

  const handleRemoveSkill = (id: string) => {
    setAddedSkills(addedSkills.filter(s => s.skill_id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const token = localStorage.getItem('token');
    const payload = {
      ...formData,
      skills: addedSkills.map(s => ({ skill_id: s.skill_id, level: s.level }))
    };

    try {
      const res = await fetch('/api/v1/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status) {
        router.push('/admin/jobs');
      } else {
        setError(data.message || 'Failed');
      }
    } catch (err) {
      setError('Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box maxWidth="md">
      <Typography variant="h4" gutterBottom>Create Job & Course</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 4 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select fullWidth label="Category"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              >
                {categories.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                required fullWidth label="Job Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth multiline rows={2} label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>

            {/* Skills Section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>Required Skills</Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9f9f9' }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    select fullWidth label="Select Skill" size="small"
                    value={selectedSkillId}
                    onChange={(e) => setSelectedSkillId(e.target.value)}
                  >
                    {skillsList.map(s => (
                      <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select style={{ width: 200 }} label="Level" size="small"
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                  >
                    <MenuItem value="BASIC">Basic</MenuItem>
                    <MenuItem value="INTERMEDIATE">Intermediate</MenuItem>
                    <MenuItem value="ADVANCED">Advanced</MenuItem>
                  </TextField>
                  <Button variant="contained" onClick={handleAddSkill}>Add</Button>
                </Stack>

                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {addedSkills.map((s) => (
                    <Chip
                      key={s.skill_id}
                      label={`${s.name} (${s.level})`}
                      onDelete={() => handleRemoveSkill(s.skill_id)}
                      color="primary"
                    />
                  ))}
                  {addedSkills.length === 0 && <Typography variant="caption" color="text.secondary">No skills added yet.</Typography>}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Job'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}
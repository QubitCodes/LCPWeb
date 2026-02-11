'use client';
import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Grid, Paper, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, Divider, Button, RadioGroup,
    FormControlLabel, Radio, CircularProgress, Alert
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QuizIcon from '@mui/icons-material/Quiz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import { useParams, useRouter } from 'next/navigation';

export default function LearningPlayerPage() {
    const { id } = useParams(); // Enrollment ID
    const router = useRouter();
    const [contentList, setContentList] = useState<any[]>([]);
    const [activeItem, setActiveItem] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        fetchContentTree();
    }, [id]);

    const fetchContentTree = async () => {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/v1/worker/enrollments/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.status) {
            setContentList(data.data);
            // Auto-select first unlocked item or continue where left off
            const firstActive = data.data.find((c: any) => c.status === 'UNLOCKED' || c.status === 'IN_PROGRESS' || c.status === 'FAILED');
            if (firstActive) selectItem(firstActive);
        }
        setLoading(false);
    };

    const selectItem = async (item: any) => {
        if (item.status === 'LOCKED') return;
        setActiveItem(item);
        setResult(null);
        setAnswers({});

        if (item.content.type === 'QUESTIONNAIRE') {
            // Fetch Questions
            const res = await fetch(`/api/v1/content/${item.content_item_id}/questions`);
            const data = await res.json();
            if (data.status) setQuestions(data.data);
        }
    };

    const handleVideoComplete = async () => {
        // Simulate watching 100%
        await submitProgress({ watch_percentage: 100 });
    };

    const handleQuizSubmit = async () => {
        const formattedAnswers = Object.entries(answers).map(([qId, optId]) => ({
            question_id: qId,
            option_id: optId
        }));
        await submitProgress({ answers: formattedAnswers });
    };

    const submitProgress = async (payload: any) => {
        const token = localStorage.getItem('token');
        const body = {
            enrollment_id: id,
            content_item_id: activeItem.content_item_id,
            ...payload
        };

        const res = await fetch('/api/v1/worker/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (data.status) {
            if (activeItem.content.type === 'QUESTIONNAIRE') {
                setResult({ passed: data.data.course_status === 'COMPLETED', score: data.data.score });
            }
            // Refresh tree to unlock next items
            fetchContentTree();
        } else {
            alert(data.message);
        }
    };

    if (loading) return <CircularProgress />;

    return (
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 100px)' }}>
            {/* Sidebar: Content List */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ borderRight: '1px solid #e0e0e0', overflowY: 'auto', height: '100%' }}>
                <Typography variant="h6" sx={{ p: 2 }}>Course Content</Typography>
                <List>
                    {contentList.map((item) => (
                        <ListItem key={item.id} disablePadding>
                            <ListItemButton
                                selected={activeItem?.id === item.id}
                                onClick={() => selectItem(item)}
                                disabled={item.status === 'LOCKED'}
                            >
                                <ListItemIcon>
                                    {item.status === 'COMPLETED' ? <CheckCircleIcon color="success" /> :
                                        item.status === 'LOCKED' ? <LockIcon color="disabled" /> :
                                            item.content.type === 'VIDEO' ? <PlayCircleOutlineIcon /> : <QuizIcon />}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.content.title}
                                    secondary={item.status}
                                    primaryTypographyProps={{
                                        color: item.status === 'LOCKED' ? 'text.secondary' : 'text.primary',
                                        fontWeight: activeItem?.id === item.id ? 'bold' : 'normal'
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Grid>

            {/* Main Content Area */}
            <Grid size={{ xs: 12, md: 9 }} sx={{ p: 4, overflowY: 'auto', height: '100%' }}>
                {activeItem ? (
                    <Box maxWidth="md" mx="auto">
                        <Typography variant="h4" gutterBottom>{activeItem.content.title}</Typography>

                        {activeItem.content.type === 'VIDEO' && (
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ bgcolor: 'black', height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', mb: 2 }}>
                                    {/* Placeholder for real video player */}
                                    <Typography>Video Player: {activeItem.content.video_url}</Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={handleVideoComplete}
                                    disabled={activeItem.status === 'COMPLETED'}
                                >
                                    {activeItem.status === 'COMPLETED' ? 'Watched' : 'Mark as Watched'}
                                </Button>
                            </Paper>
                        )}

                        {activeItem.content.type === 'QUESTIONNAIRE' && (
                            <Paper sx={{ p: 4 }}>
                                {result && (
                                    <Alert severity={result.passed ? "success" : "error"} sx={{ mb: 3 }}>
                                        Score: {result.score}%. {result.passed ? "Passed! Next item unlocked." : "Failed. Please try again."}
                                    </Alert>
                                )}

                                {!result && activeItem.status !== 'COMPLETED' ? (
                                    <>
                                        <Typography variant="subtitle1" gutterBottom sx={{ mb: 3 }}>
                                            Answer all questions to proceed. Passing score: {activeItem.content.passing_score}%
                                        </Typography>
                                        {questions.map((q, idx) => (
                                            <Box key={q.id} sx={{ mb: 4 }}>
                                                <Typography variant="h6" gutterBottom>{idx + 1}. {q.text}</Typography>
                                                <RadioGroup
                                                    value={answers[q.id] || ''}
                                                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                                                >
                                                    {q.options.map((opt: any) => (
                                                        <FormControlLabel
                                                            key={opt.id}
                                                            value={opt.id}
                                                            control={<Radio />}
                                                            label={opt.text}
                                                        />
                                                    ))}
                                                </RadioGroup>
                                            </Box>
                                        ))}
                                        <Button
                                            variant="contained"
                                            size="large"
                                            onClick={handleQuizSubmit}
                                            disabled={Object.keys(answers).length !== questions.length}
                                        >
                                            Submit Answers
                                        </Button>
                                    </>
                                ) : (
                                    <Typography variant="h6" color="success.main">
                                        Assessment Completed.
                                    </Typography>
                                )}
                            </Paper>
                        )}
                    </Box>
                ) : (
                    <Typography variant="h5" color="text.secondary" align="center" sx={{ mt: 10 }}>
                        Select an unlocked item from the menu to start.
                    </Typography>
                )}
            </Grid>
        </Grid>
    );
}
import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import auth from '../services/auth';
import './Pomodoro.css';

// Predefined timer modes with professional colors
const TIMER_MODES = {
  BEGINNER: {
    name: 'Beginner',
    icon: '🌱',
    workTime: 10 * 60, // 10 minutes
    shortBreak: 5 * 60, // 5 minutes
    longBreak: 20 * 60, // 20 minutes
    cyclesForLongBreak: 3,
    description: 'Perfect for getting started',
    color: '#4F8EF7'
  },
  INTERMEDIATE: {
    name: 'Intermediate',
    icon: '⚡',
    workTime: 25 * 60, // 25 minutes
    shortBreak: 8 * 60, // 8 minutes
    longBreak: 25 * 60, // 25 minutes
    cyclesForLongBreak: 4,
    description: 'Balanced productivity mode',
    color: '#4F8EF7'
  },
  PRO: {
    name: 'Pro',
    icon: '🔥',
    workTime: 60 * 60, // 60 minutes
    shortBreak: 8 * 60, // 8 minutes
    longBreak: 30 * 60, // 30 minutes
    cyclesForLongBreak: 4,
    description: 'Maximum focus sessions',
    color: '#4F8EF7'
  },
  CUSTOM: {
    name: 'Custom',
    icon: '⚙️',
    workTime: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
    cyclesForLongBreak: 4,
    description: 'Your personalized settings',
    color: '#4F8EF7'
  }
};

const TIMER_STATES = {
  WORK: { name: 'FOCUS TIME', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.1)', emoji: '🍅', borderColor: '#fecaca' },
  SHORT_BREAK: { name: 'SHORT BREAK', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)', emoji: '☕', borderColor: '#bfdbfe' },
  LONG_BREAK: { name: 'LONG BREAK', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.1)', emoji: '🌿', borderColor: '#a7f3d0' }
};

export default function Pomodoro() {
  // Timer states
  const [selectedMode, setSelectedMode] = useState('INTERMEDIATE');
  const [customSettings, setCustomSettings] = useState(TIMER_MODES.CUSTOM);
  const [isEditing, setIsEditing] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentState, setCurrentState] = useState('WORK');
  const [timeLeft, setTimeLeft] = useState(TIMER_MODES.INTERMEDIATE.workTime);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  
  // Tasks states
  const [allTasks, setAllTasks] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [selectedTaskForSession, setSelectedTaskForSession] = useState(null);
  const [completedSessions, setCompletedSessions] = useState({});
  const [loading, setLoading] = useState(false);
  
  const intervalRef = useRef(null);

  const currentMode = selectedMode === 'CUSTOM' ? customSettings : TIMER_MODES[selectedMode];
  const currentStateInfo = TIMER_STATES[currentState];

  // Fetch user's tasks
  useEffect(() => {
    fetchUserTasks();
  }, []);

  const fetchUserTasks = async () => {
    setLoading(true);
    try {
      const userId = auth.getUserId();
      if (!userId) return;
      const res = await api.get(`/tasks/user/${userId}`);
      setAllTasks(res.data);
      // Filter tasks that are not completed for today's session
      const activeTasks = res.data.filter(task => task.status !== 'COMPLETED');
      setTodayTasks(activeTasks);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize time when mode changes
  useEffect(() => {
    if (!isRunning && !isPaused) {
      setTimeLeft(currentMode.workTime);
      setCurrentState('WORK');
    }
  }, [selectedMode, customSettings, isRunning, isPaused, currentMode]);

  // Helper functions
  const getNotificationMessage = useCallback(() => {
    if (currentState === 'WORK') {
      const shouldLongBreak = (completedCycles + 1) % currentMode.cyclesForLongBreak === 0;
      return shouldLongBreak ? 'Time for a long break!' : 'Time for a short break!';
    }
    return 'Back to work! Stay focused!';
  }, [currentState, completedCycles, currentMode]);

  const handleTimerComplete = useCallback(() => {
    // Play notification sound (simple beep using Web Audio API)
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification not available');
    }

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification(`${currentStateInfo.name} Complete!`, {
        body: getNotificationMessage(),
        icon: '/favicon.ico'
      });
    }

    // Track completed work session for selected task
    if (currentState === 'WORK' && selectedTaskForSession) {
      const taskId = selectedTaskForSession.id || selectedTaskForSession._id;
      setCompletedSessions(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + 1
      }));
    }

    // Transition to next state
    if (currentState === 'WORK') {
      setCompletedCycles(prev => prev + 1);
      const shouldLongBreak = (completedCycles + 1) % currentMode.cyclesForLongBreak === 0;
      
      if (shouldLongBreak) {
        setCurrentState('LONG_BREAK');
        setTimeLeft(currentMode.longBreak);
      } else {
        setCurrentState('SHORT_BREAK');
        setTimeLeft(currentMode.shortBreak);
      }
    } else {
      setCurrentState('WORK');
      setTimeLeft(currentMode.workTime);
    }
  }, [currentState, currentStateInfo, selectedTaskForSession, completedCycles, currentMode, getNotificationMessage]);

  // Timer logic
  useEffect(() => {
    console.log('Timer effect triggered:', { isRunning, isPaused, timeLeft });
    
    if (isRunning && !isPaused) {
      console.log('Starting timer interval');
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          console.log('Timer tick, time left:', prev);
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      console.log('Clearing timer interval');
      clearInterval(intervalRef.current);
    }

    return () => {
      console.log('Timer effect cleanup');
      clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused, handleTimerComplete]);

  const addTaskToToday = (task) => {
    if (!todayTasks.find(t => (t.id || t._id) === (task.id || task._id))) {
      setTodayTasks(prev => [...prev, task]);
    }
  };

  const removeTaskFromToday = (taskId) => {
    setTodayTasks(prev => prev.filter(task => (task.id || task._id) !== taskId));
    if (selectedTaskForSession && (selectedTaskForSession.id || selectedTaskForSession._id) === taskId) {
      setSelectedTaskForSession(null);
    }
  };

  const selectTaskForSession = (task) => {
    setSelectedTaskForSession(task);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'NORMAL': return '#4F8EF7';
      case 'LOW': return '#10b981';
      default: return '#4F8EF7';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'TO_DO': return '#6b7280';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'COMPLETED': return '#10b981';
      default: return '#6b7280';
    }
  };

  const startTimer = () => {
    console.log('Start timer clicked');
    setIsRunning(true);
    setIsPaused(false);
    setTotalCycles(prev => prev === 0 ? 1 : prev);
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const pauseTimer = () => {
    console.log('Pause timer clicked');
    setIsPaused(true);
  };

  const resumeTimer = () => {
    console.log('Resume timer clicked');
    setIsPaused(false);
  };

  const stopTimer = () => {
    console.log('Stop timer clicked');
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(currentMode.workTime);
    setCurrentState('WORK');
  };

  const resetTimer = () => {
    console.log('Reset timer clicked');
    setIsRunning(false);
    setIsPaused(false);
    setTimeLeft(currentMode.workTime);
    setCurrentState('WORK');
    setCompletedCycles(0);
    setTotalCycles(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleModeSelect = (mode) => {
    if (isRunning || isPaused) {
      if (window.confirm('This will reset your current session. Continue?')) {
        resetTimer();
        setSelectedMode(mode);
      }
    } else {
      setSelectedMode(mode);
    }
    setIsEditing(false);
  };

  const handleCustomSettingsChange = (field, value) => {
    const numValue = parseInt(value) || 1;
    if (field === 'cyclesForLongBreak') {
      setCustomSettings(prev => ({
        ...prev,
        [field]: numValue
      }));
    } else {
      setCustomSettings(prev => ({
        ...prev,
        [field]: numValue * 60 // Convert minutes to seconds
      }));
    }
  };

  const saveCustomSettings = () => {
    if (!isRunning && !isPaused) {
      setTimeLeft(customSettings.workTime);
      setCurrentState('WORK');
    }
    setIsEditing(false);
  };

  // Calculate progress percentage
  const getTotalTime = () => {
    switch (currentState) {
      case 'WORK': return currentMode.workTime;
      case 'SHORT_BREAK': return currentMode.shortBreak;
      case 'LONG_BREAK': return currentMode.longBreak;
      default: return currentMode.workTime;
    }
  };

  const progressPercentage = ((getTotalTime() - timeLeft) / getTotalTime()) * 100;
  const cycleProgress = currentMode.cyclesForLongBreak > 0 ? (completedCycles % currentMode.cyclesForLongBreak) : 0;

  return (
    <div className="pomodoro-container">
      {/* Header */}
      <div className="pomodoro-header">
        <h1>🍅 Focus Sessions</h1>
        <p>Manage your time and tasks effectively</p>
      </div>

      <div className="pomodoro-content">
        {/* Left Section - Timer */}
        <div className="timer-section">
          {/* Current Task Display */}
          {selectedTaskForSession && (
            <div className="current-task-display">
              <div className="current-task-label">Currently Working On:</div>
              <div className="current-task-info">
                <span className="current-task-title">{selectedTaskForSession.title}</span>
                <div className="current-task-meta">
                  <span 
                    className="task-priority"
                    style={{ color: getPriorityColor(selectedTaskForSession.priority) }}
                  >
                    {selectedTaskForSession.priority}
                  </span>
                  <span className="sessions-completed">
                    🍅 {completedSessions[selectedTaskForSession.id || selectedTaskForSession._id] || 0} sessions
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Current State Display */}
          <div 
            className="state-indicator"
            style={{ 
              background: currentStateInfo.bgColor,
              border: `2px solid ${currentStateInfo.borderColor}`
            }}
          >
            <span className="state-emoji">{currentStateInfo.emoji}</span>
            <span className="state-text" style={{ color: currentStateInfo.color }}>
              {currentStateInfo.name}
            </span>
          </div>

          {/* Main Timer Display */}
          <div className="timer-display">
            <div 
              className="timer-circle"
              style={{
                background: `conic-gradient(${currentStateInfo.color} ${progressPercentage * 3.6}deg, rgba(79,142,247,0.1) 0deg)`
              }}
            >
              <div className="timer-inner">
                <div className="timer-time" style={{ color: currentStateInfo.color }}>
                  {formatTime(timeLeft)}
                </div>
                <div className="timer-label">
                  {currentState === 'WORK' ? 'Focus Time' : 'Break Time'}
                </div>
              </div>
            </div>
          </div>

          {/* Timer Controls */}
          <div className="timer-controls">
            {!isRunning ? (
              <button 
                className="control-btn start-btn" 
                onClick={(e) => {
                  console.log('Button clicked!', e);
                  startTimer();
                }}
                disabled={currentState === 'WORK' && !selectedTaskForSession}
                title={currentState === 'WORK' && !selectedTaskForSession ? 'Select a task first' : ''}
              >
                ▶️ Start
              </button>
            ) : isPaused ? (
              <button 
                className="control-btn resume-btn" 
                onClick={(e) => {
                  console.log('Resume button clicked!', e);
                  resumeTimer();
                }}
              >
                ▶️ Resume
              </button>
            ) : (
              <button 
                className="control-btn pause-btn" 
                onClick={(e) => {
                  console.log('Pause button clicked!', e);
                  pauseTimer();
                }}
              >
                ⏸️ Pause
              </button>
            )}
            
            <button className="control-btn stop-btn" onClick={(e) => {
              console.log('Stop button clicked!', e);
              stopTimer();
            }}>
              ⏹️ Stop
            </button>
            
            <button className="control-btn reset-btn" onClick={(e) => {
              console.log('Reset button clicked!', e);
              resetTimer();
            }}>
              🔄 Reset
            </button>
          </div>

          {/* Cycle Progress */}
          <div className="cycle-progress">
            <div className="cycle-header">
              <span>🔄 Cycle Progress</span>
              <span className="cycle-count">{completedCycles} completed</span>
            </div>
            <div className="cycle-bar">
              {Array.from({ length: currentMode.cyclesForLongBreak }).map((_, index) => (
                <div
                  key={index}
                  className={`cycle-segment ${index < cycleProgress ? 'completed' : ''}`}
                  style={{
                    backgroundColor: index < cycleProgress ? '#4F8EF7' : 'rgba(255,255,255,0.1)'
                  }}
                />
              ))}
            </div>
            <div className="cycle-label">
              {cycleProgress}/{currentMode.cyclesForLongBreak} cycles until long break
            </div>
          </div>

          {/* Timer Settings - Compact */}
          <div className="timer-settings-compact">
            <div className="settings-compact-header">
              <span>⚙️ {currentMode.icon} {currentMode.name} Mode</span>
              <button 
                className="edit-btn-compact"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? '❌' : '✏️'}
              </button>
            </div>
            
            {isEditing && (
              <div className="mode-selector">
                {Object.entries(TIMER_MODES).map(([key, mode]) => (
                  <button
                    key={key}
                    className={`mode-btn ${selectedMode === key ? 'selected' : ''}`}
                    onClick={() => handleModeSelect(key)}
                  >
                    {mode.icon} {mode.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Section - Today's Tasks */}
        <div className="tasks-section">
          <div className="tasks-header">
            <h2>📋 Today's Focus Tasks</h2>
            <div className="tasks-stats">
              {todayTasks.length} tasks • {Object.values(completedSessions).reduce((a, b) => a + b, 0)} sessions
            </div>
          </div>

          {/* Available Tasks */}
          <div className="available-tasks">
            <h3>📚 Available Tasks</h3>
            <div className="tasks-list">
              {loading ? (
                <div className="loading-state">Loading tasks...</div>
              ) : allTasks.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📝</div>
                  <p>No tasks found</p>
                  <small>Create some tasks to get started!</small>
                </div>
              ) : (
                allTasks
                  .filter(task => !todayTasks.find(t => (t.id || t._id) === (task.id || task._id)))
                  .slice(0, 5)
                  .map(task => (
                    <div key={task.id || task._id} className="task-item available">
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span 
                            className="task-priority-badge"
                            style={{ 
                              backgroundColor: `${getPriorityColor(task.priority)}15`,
                              color: getPriorityColor(task.priority)
                            }}
                          >
                            {task.priority}
                          </span>
                          <span 
                            className="task-status-badge"
                            style={{ 
                              backgroundColor: `${getStatusColor(task.status)}15`,
                              color: getStatusColor(task.status)
                            }}
                          >
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="add-task-btn"
                        onClick={() => addTaskToToday(task)}
                        title="Add to today's focus list"
                      >
                        ➕
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Today's Focus Tasks */}
          <div className="today-tasks">
            <h3>🎯 Focus List</h3>
            <div className="tasks-list">
              {todayTasks.length === 0 ? (
                <div className="empty-state small">
                  <div className="empty-icon">🎯</div>
                  <p>No tasks selected</p>
                  <small>Add tasks from above to focus on today</small>
                </div>
              ) : (
                todayTasks.map(task => {
                  const taskId = task.id || task._id;
                  const isSelected = selectedTaskForSession && (selectedTaskForSession.id || selectedTaskForSession._id) === taskId;
                  const sessionsCount = completedSessions[taskId] || 0;
                  
                  return (
                    <div 
                      key={taskId} 
                      className={`task-item today ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectTaskForSession(task)}
                      style={{
                        borderColor: isSelected ? currentStateInfo.color : 'rgba(79,142,247,0.2)',
                        background: isSelected ? `${currentStateInfo.color}08` : 'rgba(255,255,255,0.05)'
                      }}
                    >
                      <div className="task-content">
                        <div className="task-title">{task.title}</div>
                        <div className="task-meta">
                          <span 
                            className="task-priority-badge"
                            style={{ 
                              backgroundColor: `${getPriorityColor(task.priority)}15`,
                              color: getPriorityColor(task.priority)
                            }}
                          >
                            {task.priority}
                          </span>
                          <span className="sessions-badge">
                            🍅 {sessionsCount} sessions
                          </span>
                        </div>
                        {task.description && (
                          <div className="task-description">{task.description}</div>
                        )}
                      </div>
                      <div className="task-actions">
                        <button 
                          className="remove-task-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeTaskFromToday(taskId);
                          }}
                          title="Remove from today's list"
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Session Summary */}
          {Object.keys(completedSessions).length > 0 && (
            <div className="session-summary">
              <h3>📊 Today's Progress</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <div className="stat-value">{Object.values(completedSessions).reduce((a, b) => a + b, 0)}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{Math.round(Object.values(completedSessions).reduce((a, b) => a + b, 0) * (currentMode.workTime / 60))}</div>
                  <div className="stat-label">Minutes Focused</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value">{completedCycles}</div>
                  <div className="stat-label">Cycles Done</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import api from '../services/api';
import auth from '../services/auth';

// Utility function to calculate days until deadline
const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Utility function to format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TaskList({ reload }) {
  const [tasks, setTasks] = useState([]);
  const [sort, setSort] = useState('title');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [tempValues, setTempValues] = useState({});

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const userId = auth.getUserId();
      if (!userId) return;
      const res = await api.get(`/tasks/user/${userId}`);
      console.log('Fetched tasks:', res.data);
      setTasks(res.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line
  }, [reload]);

  // Update task in database
  const updateTask = async (taskId, updates) => {
    try {
      const taskToUpdate = tasks.find(t => (t.id || t._id) === taskId);
      const updatedTaskData = { ...taskToUpdate, ...updates };
      
      const res = await api.put(`/tasks/${taskId}`, updatedTaskData);
      console.log('Updated task:', res.data);
      
      // Update local state
      setTasks(tasks.map(task => 
        (task.id || task._id) === taskId ? res.data : task
      ));
      
      return res.data;
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  };

  // Handle editing functions
  const startEdit = (taskId, field) => {
    const task = tasks.find(t => (t.id || t._id) === taskId);
    setEditingTask(taskId);
    setEditingField(field);
    setTempValues({ [field]: task[field] });
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditingField(null);
    setTempValues({});
  };

  const saveEdit = async (taskId) => {
    try {
      await updateTask(taskId, tempValues);
      cancelEdit();
    } catch (err) {
      alert('Failed to update task. Please try again.');
    }
  };

  const handleInputChange = (field, value) => {
    setTempValues({ ...tempValues, [field]: value });
  };

  // Delete task
  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }
    
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => (task.id || task._id) !== taskId));
      console.log('Deleted task:', taskId);
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task. Please try again.');
    }
  };

  console.log('Current tasks:', tasks);
  console.log('Current filter:', filter);

  const filtered = tasks
    .filter(t => filter === 'All' || t.status === filter)
    .filter(t => t.title?.toLowerCase().includes(search.toLowerCase()));

  console.log('Filtered tasks:', filtered);

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'title') return a.title.localeCompare(b.title);
    if (sort === 'priority') return a.priority.localeCompare(b.priority);
    return 0;
  });

  return (
    <div>
      {/* Modern Filter & Search Bar */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0)', 
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16, 
        padding: '20px 24px', 
        marginBottom: 24,
        boxShadow: '0 8px 32px rgba(79,142,247,0.08)',
        border: '1px solid rgba(255,255,255,0.2)',
        display: 'flex', 
        gap: 16, 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <select value={sort} onChange={e => setSort(e.target.value)} style={{ 
          padding: '12px 16px', 
          borderRadius: 12, 
          border: '1px solid rgba(79,142,247,0.15)',
          background: 'rgba(79,142,247,0.05)',
          fontSize: 14,
          fontWeight: 500,
          color: '#4F8EF7',
          minWidth: 140,
          backdropFilter: 'blur(8px)'
        }}>
          <option value="title"> Sort by Title</option>
          <option value="priority"> Sort by Priority</option>
        </select>
        
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ 
          padding: '12px 16px', 
          borderRadius: 12, 
          border: '1px solid rgba(79,142,247,0.15)',
          background: 'rgba(79,142,247,0.05)',
          fontSize: 14,
          fontWeight: 500,
          color: '#4F8EF7',
          minWidth: 140,
          backdropFilter: 'blur(8px)'
        }}>
          <option value="All"> All Tasks</option>
          <option value="TO_DO"> To Do</option>
          <option value="IN_PROGRESS"> In Progress</option>
          <option value="COMPLETED"> Completed</option>
        </select>
        
        <input 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          placeholder="🔍 Search tasks..." 
          style={{ 
            padding: '12px 20px', 
            borderRadius: 12, 
            border: '1px solid rgba(79,142,247,0.15)',
            background: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            flex: 1,
            minWidth: 200,
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s ease',
            outline: 'none'
          }} 
          onFocus={e => e.target.style.borderColor = '#4F8EF7'}
          onBlur={e => e.target.style.borderColor = 'rgba(79,142,247,0.15)'}
        />
      </div>

      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 16,
          color: '#4F8EF7',
          fontSize: 16,
          fontWeight: 500
        }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
          Loading your tasks...
        </div>
      ) : null}

      {/* Task Table Layout */}
      <div style={{
        background: 'rgba(255,255,255,0.95)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 20,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(79,142,247,0.12)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 2.5fr 1fr 1fr 1fr 1fr 1fr 120px',
          gap: 12,
          padding: '20px 24px',
          background: 'rgba(79,142,247,0.08)',
          borderBottom: '1px solid rgba(79,142,247,0.1)',
          fontWeight: 600,
          fontSize: 13,
          color: '#4F8EF7'
        }}>
          <div> TITLE</div>
          <div> DESCRIPTION</div>
          <div> START DATE</div>
          <div> DEADLINE</div>
          <div> DUE IN</div>
          <div> PRIORITY</div>
          <div> STATUS</div>
          <div> ACTIONS</div>
        </div>

        {/* Task Rows */}
        {sorted.map(task => {
          const taskId = task.id || task._id;
          const isEditing = editingTask === taskId;
          
          const priorityConfig = {
            HIGH: { color: '#e53e3e', bg: 'rgba(229,62,62,0.1)', label: 'High' },
            NORMAL: { color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)',  label: 'Normal' },
            LOW: { color: '#38a169', bg: 'rgba(56,161,105,0.1)',  label: 'Low' }
          };
          
          const statusConfig = {
            TO_DO: { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'To Do' },
            IN_PROGRESS: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'In Progress' },
            COMPLETED: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'Completed' }
          };

          const priority = priorityConfig[task.priority] || priorityConfig.NORMAL;
          const status = statusConfig[task.status] || statusConfig.TO_DO;
          const daysUntil = getDaysUntilDeadline(task.deadline);

          return (
            <div key={taskId} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 2.5fr 1fr 1fr 1fr 1fr 1fr 120px',
              gap: 12,
              padding: '20px 24px',
              borderBottom: '1px solid rgba(79,142,247,0.05)',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              background: isEditing ? 'rgba(79,142,247,0.03)' : 'transparent'
            }}
            onMouseEnter={e => !isEditing && (e.currentTarget.style.background = 'rgba(79,142,247,0.02)')}
            onMouseLeave={e => !isEditing && (e.currentTarget.style.background = 'transparent')}
            >
              {/* Title Column */}
              <div>
                {isEditing && editingField === 'title' ? (
                  <input
                    value={tempValues.title || ''}
                    onChange={e => handleInputChange('title', e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && saveEdit(taskId)}
                    onBlur={() => saveEdit(taskId)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #4F8EF7',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(taskId, 'title')}
                    style={{
                      fontWeight: 600,
                      color: '#1f2937',
                      fontSize: 14,
                      cursor: 'pointer',
                      padding: '8px 4px',
                      borderRadius: 6,
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(79,142,247,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    {task.title}
                  </div>
                )}
              </div>

              {/* Description Column */}
              <div>
                {isEditing && editingField === 'description' ? (
                  <textarea
                    value={tempValues.description || ''}
                    onChange={e => handleInputChange('description', e.target.value)}
                    onBlur={() => saveEdit(taskId)}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px 12px',
                      border: '2px solid #4F8EF7',
                      borderRadius: 8,
                      fontSize: 13,
                      background: 'white',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(taskId, 'description')}
                    style={{
                      color: '#6b7280',
                      fontSize: 13,
                      cursor: 'pointer',
                      padding: '8px 4px',
                      borderRadius: 6,
                      transition: 'background 0.2s ease',
                      minHeight: '20px'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(79,142,247,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    {task.description || 'Click to add description...'}
                  </div>
                )}
              </div>

              {/* Start Date Column */}
              <div>
                {isEditing && editingField === 'startDate' ? (
                  <input
                    type="datetime-local"
                    value={tempValues.startDate || (task.startDate ? new Date(task.startDate).toISOString().slice(0, 16) : '')}
                    onChange={e => handleInputChange('startDate', e.target.value)}
                    onBlur={() => saveEdit(taskId)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #4F8EF7',
                      borderRadius: 8,
                      fontSize: 12,
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(taskId, 'startDate')}
                    style={{
                      color: '#6b7280',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: '8px 4px',
                      borderRadius: 6,
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(79,142,247,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    {task.startDate ? formatDate(task.startDate) : 'Set start date'}
                  </div>
                )}
              </div>

              {/* Deadline Column */}
              <div>
                {isEditing && editingField === 'deadline' ? (
                  <input
                    type="datetime-local"
                    value={tempValues.deadline || (task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '')}
                    onChange={e => handleInputChange('deadline', e.target.value)}
                    onBlur={() => saveEdit(taskId)}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #4F8EF7',
                      borderRadius: 8,
                      fontSize: 12,
                      background: 'white',
                      outline: 'none'
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(taskId, 'deadline')}
                    style={{
                      color: '#6b7280',
                      fontSize: 12,
                      cursor: 'pointer',
                      padding: '8px 4px',
                      borderRadius: 6,
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.style.background = 'rgba(79,142,247,0.1)'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                  >
                    {task.deadline ? formatDate(task.deadline) : 'Set deadline'}
                  </div>
                )}
              </div>

              {/* Due In Column */}
              <div>
                {daysUntil !== null && (
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: 8,
                    fontSize: 11,
                    fontWeight: 600,
                    textAlign: 'center',
                    background: daysUntil <= 0 ? 'rgba(239,68,68,0.1)' : 
                               daysUntil <= 3 ? 'rgba(245,158,11,0.1)' : 
                               'rgba(16,185,129,0.1)',
                    color: daysUntil <= 0 ? '#ef4444' : 
                           daysUntil <= 3 ? '#f59e0b' : 
                           '#10b981',
                    border: `1px solid ${daysUntil <= 0 ? '#ef4444' : 
                                        daysUntil <= 3 ? '#f59e0b' : 
                                        '#10b981'}20`
                  }}>
                    {daysUntil <= 0 ? (
                      `⚠️ ${Math.abs(daysUntil)} days overdue`
                    ) : daysUntil === 1 ? (
                      '🔥 Due tomorrow'
                    ) : (
                      `⏳ ${daysUntil} days left`
                    )}
                  </div>
                )}
              </div>

              {/* Priority Column */}
              <div>
                {isEditing && editingField === 'priority' ? (
                  <select
                    value={tempValues.priority || task.priority}
                    onChange={e => {
                      handleInputChange('priority', e.target.value);
                      setTimeout(() => saveEdit(taskId), 100);
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #4F8EF7',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'white',
                      outline: 'none',
                      color: priority.color
                    }}
                  >
                    <option value="HIGH" style={{ color: '#e53e3e' }}>🔥 High</option>
                    <option value="NORMAL" style={{ color: '#4F8EF7' }}>⚡ Normal</option>
                    <option value="LOW" style={{ color: '#38a169' }}>🌱 Low</option>
                  </select>
                ) : (
                  <div
                    onClick={() => startEdit(taskId, 'priority')}
                    style={{
                      background: priority.bg,
                      color: priority.color,
                      padding: '6px 12px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      border: `1px solid ${priority.color}20`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    <span>{priority.emoji}</span>
                    {priority.label}
                  </div>
                )}
              </div>

              {/* Status Column */}
              <div>
                {isEditing && editingField === 'status' ? (
                  <select
                    value={tempValues.status || task.status}
                    onChange={e => {
                      handleInputChange('status', e.target.value);
                      setTimeout(() => saveEdit(taskId), 100);
                    }}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #4F8EF7',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'white',
                      outline: 'none',
                      color: status.color
                    }}
                  >
                    <option value="TO_DO" style={{ color: '#6b7280' }}>📝 To Do</option>
                    <option value="IN_PROGRESS" style={{ color: '#f59e0b' }}>🔄 In Progress</option>
                    <option value="COMPLETED" style={{ color: '#10b981' }}>✅ Completed</option>
                  </select>
                ) : (
                  <div
                    onClick={() => startEdit(taskId, 'status')}
                    style={{
                      background: status.bg,
                      color: status.color,
                      padding: '6px 12px',
                      borderRadius: 10,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      cursor: 'pointer',
                      border: `1px solid ${status.color}20`,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                  >
                    <span>{status.emoji}</span>
                    {status.label}
                  </div>
                )}
              </div>

              {/* Actions Column */}
              <div style={{ display: 'flex', gap: 8 }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => saveEdit(taskId)}
                      style={{
                        background: 'rgba(16,185,129,0.1)',
                        border: '1px solid rgba(16,185,129,0.3)',
                        borderRadius: 8,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#10b981',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ✅
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 8,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: '#ef4444',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ❌
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(taskId, 'title')}
                      title="Edit Title/Description"
                      style={{
                        background: 'rgba(79,142,247,0.1)',
                        border: '1px solid rgba(79,142,247,0.2)',
                        borderRadius: 8,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(79,142,247,0.2)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(79,142,247,0.1)'}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTask(taskId)}
                      title="Delete Task"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 8,
                        padding: '6px 8px',
                        cursor: 'pointer',
                        fontSize: 14,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.2)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.1)'}
                    >
                      🗑️
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && sorted.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: 20,
          border: '2px dashed rgba(79,142,247,0.2)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📝</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#4F8EF7', marginBottom: 8 }}>
            No tasks found
          </div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            {search ? `No tasks match "${search}"` : 'Start by creating your first task!'}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import api from '../services/api';
import auth from '../services/auth';

// We use localStorage to persist userId after registration/login so it can be accessed across pages and browser reloads.

export default function TaskForm({ onCreate }) {
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    priority: 'NORMAL', 
    status: 'TO_DO',
    startDate: '',
    deadline: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = e => {
    const value = e.target.type === 'datetime-local' ? e.target.value : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.startDate) {
      setError('Start date is required');
      return;
    }
    if (!form.deadline) {
      setError('Deadline is required');
      return;
    }
    if (new Date(form.startDate) >= new Date(form.deadline)) {
      setError('Deadline must be after start date');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const userId = auth.getUserId();
      if (!userId) {
        setError('User ID not found. Please log in again.');
        setLoading(false);
        return;
      }
      const payload = { 
        ...form, 
        userId, 
        priority: form.priority, 
        status: form.status,
        startDate: form.startDate,
        deadline: form.deadline
      };
      console.log('Creating task with payload:', payload);
      const response = await api.post('/tasks', payload);
      console.log('Task created successfully:', response.data);
      if (onCreate) onCreate();
      setForm({ 
        title: '', 
        description: '', 
        priority: 'NORMAL', 
        status: 'TO_DO',
        startDate: '',
        deadline: '' 
      });
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <input 
          name="title" 
          value={form.title} 
          onChange={onChange} 
          placeholder="Task title" 
          style={{ 
            padding: '10px 12px', 
            borderRadius: 8, 
            border: '1px solid #dbeafe', 
            fontSize: 16,
            gridColumn: '1 / -1'
          }} 
        />
        
        <input 
          name="description" 
          value={form.description} 
          onChange={onChange} 
          placeholder="Description" 
          style={{ 
            padding: '10px 12px', 
            borderRadius: 8, 
            border: '1px solid #dbeafe', 
            fontSize: 16,
            gridColumn: '1 / -1'
          }} 
        />
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Start Date</label>
          <input 
            type="datetime-local" 
            name="startDate" 
            value={form.startDate} 
            onChange={onChange} 
            style={{ 
              padding: '10px 12px', 
              borderRadius: 8, 
              border: '1px solid #dbeafe', 
              fontSize: 16 
            }} 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Deadline</label>
          <input 
            type="datetime-local" 
            name="deadline" 
            value={form.deadline} 
            onChange={onChange} 
            style={{ 
              padding: '10px 12px', 
              borderRadius: 8, 
              border: '1px solid #dbeafe', 
              fontSize: 16 
            }} 
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Priority</label>
          <select 
            name="priority" 
            value={form.priority} 
            onChange={onChange} 
            style={{ 
              padding: '10px', 
              borderRadius: 8, 
              border: '1px solid #dbeafe', 
              fontSize: 16 
            }}
          >
            <option value="LOW">Low</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">High</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: '#374151' }}>Status</label>
          <select 
            name="status" 
            value={form.status} 
            onChange={onChange} 
            style={{ 
              padding: '10px', 
              borderRadius: 8, 
              border: '1px solid #dbeafe', 
              fontSize: 16 
            }}
          >
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading} 
          style={{ 
            background: '#4F8EF7', 
            color: 'white', 
            fontWeight: 600, 
            fontSize: 16, 
            border: 'none', 
            borderRadius: 8, 
            padding: '12px 24px', 
            cursor: 'pointer',
            gridColumn: '1 / -1',
            marginTop: 8
          }}
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </form>
      
      {error && (
        <div style={{ 
          color: '#e53e3e', 
          fontWeight: 500, 
          marginTop: 12, 
          padding: '8px 12px', 
          backgroundColor: '#fed7d7', 
          borderRadius: 8, 
          border: '1px solid #feb2b2' 
        }}>
          {error}
        </div>
      )}
    </div>
  );
}

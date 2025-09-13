import React, { useState } from 'react';
import TaskForm from '../components/TaskForm';
import TaskList from '../components/TaskList';

export default function Tasks() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <h1 style={{ color: '#4F8EF7', fontWeight: 700, fontSize: 28, marginBottom: 24 }}>Tasks</h1>
      <TaskForm onCreate={handleTaskCreated} />
      <TaskList reload={refreshKey} />
    </div>
  );
}

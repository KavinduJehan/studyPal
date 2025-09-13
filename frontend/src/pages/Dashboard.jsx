import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import auth from '../services/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const userName = auth.getUserName();
  const isNewUser = auth.getIsNewUser();

  useEffect(() => {
    // Redirect new users to profile page to complete setup
    if (isNewUser) {
      navigate('/profile');
    }
  }, [isNewUser, navigate]);

  const getWelcomeMessage = () => {
    if (!userName) return 'Welcome to StudyPal';
    return isNewUser ? `Welcome ${userName}!` : `Welcome back ${userName}!`;
  };

  return (
    <div>
      <h1 style={{ 
        fontSize: 32, 
        fontWeight: 700, 
        color: '#4F8EF7', 
        marginBottom: 8 
      }}>
        {getWelcomeMessage()}
      </h1>
      {isNewUser && (
        <p style={{ 
          color: '#6b7280', 
          fontSize: 16, 
          marginBottom: 32,
          padding: '12px 20px',
          background: 'rgba(79,142,247,0.1)',
          borderRadius: 12,
          border: '1px solid rgba(79,142,247,0.2)'
        }}>
          🎉 Great to have you here! Please complete your profile to get started.
        </p>
      )}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(12px)',
          borderRadius: 16, 
          boxShadow: '0 8px 32px rgba(79,142,247,0.12)', 
          border: '1px solid rgba(255,255,255,0.2)',
          padding: 28, 
          minWidth: 280 
        }}>
          <h2 style={{ 
            color: '#4F8EF7', 
            fontSize: 20, 
            fontWeight: 600, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📅 Upcoming Tasks
          </h2>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            No tasks due soon. Create your first task to get started!
          </div>
        </div>
        <div style={{ 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(12px)',
          borderRadius: 16, 
          boxShadow: '0 8px 32px rgba(79,142,247,0.12)', 
          border: '1px solid rgba(255,255,255,0.2)',
          padding: 28, 
          minWidth: 280 
        }}>
          <h2 style={{ 
            color: '#4F8EF7', 
            fontSize: 20, 
            fontWeight: 600, 
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            📊 Productivity Stats
          </h2>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            Complete a task to see your productivity insights!
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import auth from '../services/auth';
import api from '../services/api';

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Pomodoro', path: '/pomodoro' },
  { label: 'Diary', path: '/diary' },

];

export default function Navbar() {
  const location = useLocation();
  const [user, setUser] = useState({ name: '', profilePicture: '' });
  const userId = auth.getUserId();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (userId) {
          const res = await api.get(`/users/${userId}`);
          console.log('Navbar fetched user data:', res.data); // Debug log
          setUser({
            name: res.data.name || auth.getUserName() || 'User',
            profilePicture: res.data.profilePicture || ''
          });
        }
      } catch (err) {
        console.error('Navbar error fetching user:', err);
        setUser({
          name: auth.getUserName() || 'User',
          profilePicture: ''
        });
      }
    };

    fetchUserData();

    // Listen for profile updates
    const handleProfileUpdate = (event) => {
      console.log('Profile updated event received:', event.detail);
      setUser({
        name: event.detail.name || 'User',
        profilePicture: event.detail.profilePicture || ''
      });
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);

    // Cleanup event listener
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [userId]);

  return (
    <nav style={{
      width: '100%',
      background: 'rgba(32, 101, 220, 0.35)',
      color: 'white',
      padding: '0 24px',
      height: 64,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 4px 24px rgba(79,142,247,0.10)',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      fontFamily: 'Segoe UI, Arial, sans-serif',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      borderBottom: '1px solid rgba(255,255,255,0.18)',
      overflow: 'hidden'
    }}>
      <div style={{ 
        fontWeight: 700, 
        fontSize: 20, 
        letterSpacing: 1, 
        textShadow: '0 2px 8px rgba(79,142,247,0.10)',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        minWidth: 'fit-content'
      }}>
        StudyPal
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        alignItems: 'center',
        height: '100%',
        flex: 1,
        justifyContent: 'flex-end',
        overflow: 'hidden'
      }}>
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              color: location.pathname === item.path ? '#ffffff' : 'rgba(255,255,255,0.85)',
              background: location.pathname === item.path ? 'rgba(255,255,255,0.18)' : 'transparent',
              fontWeight: location.pathname === item.path ? 700 : 500,
              textDecoration: 'none',
              borderRadius: 12,
              padding: '15px 20px',
              transition: 'all 0.2s ease',
              fontSize: 16,
              boxShadow: location.pathname === item.path ? '0 2px 8px rgba(79,142,247,0.10)' : 'none',
              backdropFilter: location.pathname === item.path ? 'blur(8px)' : 'none',
              WebkitBackdropFilter: location.pathname === item.path ? 'blur(8px)' : 'none',
              display: 'flex',
              alignItems: 'center',
              height: 'auto',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={e => {
              if (location.pathname !== item.path) {
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }
            }}
            onMouseLeave={e => {
              if (location.pathname !== item.path) {
                e.target.style.background = 'transparent';
              }
            }}
          >
            {item.label}
          </Link>
        ))}
        
        {/* Profile Section */}
        <Link 
          to="/profile" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 10,
            textDecoration: 'none',
            color: location.pathname === '/profile' ? '#ffffff' : 'rgba(255,255,255,0.85)',
            background: location.pathname === '/profile' ? 'rgba(255,255,255,0.18)' : 'transparent',
            borderRadius: 12,
            padding: '10px 60px',
            transition: 'all 0.2s ease',
            boxShadow: location.pathname === '/profile' ? '0 2px 8px rgba(79,142,247,0.10)' : 'none',
            backdropFilter: location.pathname === '/profile' ? 'blur(8px)' : 'none',
            WebkitBackdropFilter: location.pathname === '/profile' ? 'blur(8px)' : 'none',
            height: 'auto',
            minWidth: 'fit-content',
            maxWidth: '200px',
            marginLeft: '10px'
          }}
          onMouseEnter={e => {
            if (location.pathname !== '/profile') {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }
          }}
          onMouseLeave={e => {
            if (location.pathname !== '/profile') {
              e.currentTarget.style.background = 'transparent';
            }
          }}
        >
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt="Profile" 
              style={{ 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '2px solid rgba(255,255,255,0.3)',
                flexShrink: 0
              }} 
            />
          ) : (
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: '50%', 
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 16,
              border: '2px solid rgba(255,255,255,0.3)',
              flexShrink: 0
            }}>
              👤
            </div>
          )}
          <span style={{ 
            fontSize: 16, 
            fontWeight: location.pathname === '/profile' ? 700 : 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '140px'
          }}>
            {user.name || 'Profile'}
          </span>
        </Link>
      </div>
    </nav>
  );
}

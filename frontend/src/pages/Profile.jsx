import React, { useState, useEffect, useRef } from 'react';
import auth from '../services/auth';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [form, setForm] = useState({ name: '', email: '', profilePicture: '' });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  
  const isNewUser = auth.getIsNewUser();
  const userId = auth.getUserId();

  const fetchUserData = async () => {
    try {
      const res = await api.get(`/users/${userId}`);
      console.log('Profile fetched user data:', res.data); // Debug log
      setForm({ 
        name: res.data.name || '', 
        email: res.data.email || '',
        profilePicture: res.data.profilePicture || ''
      });
      setUserLoaded(true);
      
      // Auto-enable editing for new users
      if (isNewUser || !res.data.name) {
        setEditing(true);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setMessage('Error loading profile data');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const onChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  // Handle file upload (convert to base64)
  const handleFileUpload = async (file) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file (PNG, JPG, GIF)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
    
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target.result;
        setForm({ ...form, profilePicture: base64String });
        setUploadingImage(false);
        setMessage('Image uploaded successfully! Remember to save your profile.');
      };
      reader.onerror = () => {
        setUploadingImage(false);
        setMessage('Error reading file');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingImage(false);
      setMessage('Error processing image');
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const onEdit = () => setEditing(true);
  const onCancel = () => {
    setEditing(false);
    fetchUserData(); // Reset form to original values
  };

  const onSave = async e => {
    e.preventDefault();
    if (!form.name.trim()) {
      setMessage('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const res = await api.put(`/users/${userId}`, {
        name: form.name.trim(),
        email: form.email,
        profilePicture: form.profilePicture || null // Explicitly send null if empty
      });
      
      // Update localStorage with new name
      localStorage.setItem('userName', res.data.name);
      localStorage.setItem('isNewUser', 'false');
      
      // Trigger a page refresh to update navbar (or emit a custom event)
      window.dispatchEvent(new CustomEvent('profileUpdated', { 
        detail: { 
          name: res.data.name, 
          profilePicture: res.data.profilePicture 
        }
      }));
      
      setMessage('Profile updated successfully!');
      setEditing(false);
      
      // Redirect to dashboard after profile setup
      if (isNewUser) {
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage('Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const removeProfilePicture = () => {
    setForm({ ...form, profilePicture: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!userLoaded) {
    return (
      <div style={{ 
        maxWidth: 480, 
        margin: '0 auto', 
        background: 'rgba(255,255,255,0.95)', 
        backdropFilter: 'blur(12px)',
        borderRadius: 16, 
        boxShadow: '0 8px 32px rgba(79,142,247,0.12)', 
        border: '1px solid rgba(255,255,255,0.2)',
        padding: 32,
        textAlign: 'center'
      }}>
        <div style={{ color: '#4F8EF7', fontSize: 16 }}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: 600, 
      margin: '0 auto', 
      background: 'rgba(255,255,255,0.95)', 
      backdropFilter: 'blur(12px)',
      borderRadius: 20, 
      boxShadow: '0 8px 32px rgba(79,142,247,0.12)', 
      border: '1px solid rgba(255,255,255,0.2)',
      padding: 40 
    }}>
      <h1 style={{ 
        color: '#4F8EF7', 
        fontWeight: 700, 
        fontSize: 32, 
        marginBottom: 8,
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        👤 {isNewUser ? 'Complete Your Profile' : 'Your Profile'}
      </h1>
      
      {isNewUser && (
        <p style={{ 
          color: '#6b7280', 
          fontSize: 16, 
          marginBottom: 32,
          padding: '16px 20px',
          background: 'rgba(79,142,247,0.1)',
          borderRadius: 12,
          border: '1px solid rgba(79,142,247,0.2)'
        }}>
          🎉 Welcome to StudyPal! Please complete your profile setup.
        </p>
      )}

      {/* Profile Picture Section */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: 32,
        padding: '20px',
        background: 'rgba(79,142,247,0.05)',
        borderRadius: 16,
        border: '1px solid rgba(79,142,247,0.1)'
      }}>
        <div style={{ marginBottom: 16 }}>
          {form.profilePicture ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={form.profilePicture} 
                alt="Profile" 
                style={{ 
                  width: 120, 
                  height: 120, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '4px solid #4F8EF7',
                  boxShadow: '0 4px 16px rgba(79,142,247,0.3)'
                }} 
              />
              {editing && (
                <button
                  onClick={removeProfilePicture}
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    background: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    cursor: 'pointer',
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                  title="Remove profile picture"
                >
                  ✕
                </button>
              )}
            </div>
          ) : (
            <div style={{ 
              width: 120, 
              height: 120, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4F8EF7, #6366f1)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 48,
              color: 'white',
              margin: '0 auto',
              boxShadow: '0 4px 16px rgba(79,142,247,0.3)'
            }}>
              👤
            </div>
          )}
        </div>

        {editing && (
          <div>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? '#4F8EF7' : 'rgba(79,142,247,0.3)'}`,
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: dragOver ? 'rgba(79,142,247,0.1)' : 'transparent',
                marginBottom: 16
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div style={{ color: '#4F8EF7', fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                📸 {uploadingImage ? 'Processing...' : 'Upload Profile Picture'}
              </div>
              <div style={{ color: '#6b7280', fontSize: 14 }}>
                Drag and drop an image here, or click to select<br/>
                <small>Supports PNG, JPG, GIF (max 5MB)</small>
              </div>
            </div>
            
            {form.profilePicture && (
              <button
                onClick={removeProfilePicture}
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 500
                }}
              >
                🗑️ Remove Picture
              </button>
            )}
          </div>
        )}
      </div>

      {!editing ? (
        <div>
          <div style={{ 
            marginBottom: 24,
            padding: '20px',
            background: 'rgba(79,142,247,0.05)',
            borderRadius: 12,
            border: '1px solid rgba(79,142,247,0.1)'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: 12 
            }}>
              <span style={{ fontWeight: 600, color: '#4F8EF7' }}>Name:</span>
              <span style={{ color: '#1f2937' }}>{form.name || 'Not set'}</span>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between' 
            }}>
              <span style={{ fontWeight: 600, color: '#4F8EF7' }}>Email:</span>
              <span style={{ color: '#1f2937' }}>{form.email}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={onEdit} 
              style={{ 
                background: 'linear-gradient(135deg, #4F8EF7, #6366f1)',
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
                padding: '14px 28px', 
                fontWeight: 600, 
                cursor: 'pointer',
                fontSize: 16,
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(79,142,247,0.3)'
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              ✏️ Edit Profile
            </button>
            <button 
              onClick={onLogout} 
              style={{ 
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444', 
                border: '1px solid rgba(239,68,68,0.2)', 
                borderRadius: 12, 
                padding: '14px 28px', 
                fontWeight: 600, 
                cursor: 'pointer',
                fontSize: 16,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.target.style.background = 'rgba(239,68,68,0.2)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'rgba(239,68,68,0.1)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <label style={{ 
              color: '#4F8EF7', 
              fontWeight: 600, 
              marginBottom: 8, 
              display: 'block',
              fontSize: 16
            }}>
              Full Name *
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={onChange}
              placeholder="Enter your full name"
              required
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 12, 
                border: '2px solid rgba(79,142,247,0.2)',
                fontSize: 16,
                background: 'rgba(255,255,255,0.8)',
                backdropFilter: 'blur(8px)',
                outline: 'none',
                transition: 'border-color 0.3s ease'
              }}
              onFocus={e => e.target.style.borderColor = '#4F8EF7'}
              onBlur={e => e.target.style.borderColor = 'rgba(79,142,247,0.2)'}
            />
          </div>
          
          <div>
            <label style={{ 
              color: '#4F8EF7', 
              fontWeight: 600, 
              marginBottom: 8, 
              display: 'block',
              fontSize: 16
            }}>
              Email Address
            </label>
            <input 
              name="email" 
              value={form.email} 
              onChange={onChange} 
              type="email"
              disabled
              style={{ 
                width: '100%', 
                padding: '16px 20px', 
                borderRadius: 12, 
                border: '2px solid rgba(79,142,247,0.1)',
                fontSize: 16,
                background: 'rgba(79,142,247,0.05)',
                color: '#6b7280',
                cursor: 'not-allowed'
              }}
            />
            <p style={{ 
              fontSize: 14, 
              color: '#6b7280', 
              marginTop: 6 
            }}>
              Email cannot be changed
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <button 
              type="submit" 
              disabled={loading || uploadingImage}
              style={{ 
                background: (loading || uploadingImage) ? '#9ca3af' : 'linear-gradient(135deg, #4F8EF7, #6366f1)',
                color: 'white', 
                border: 'none', 
                borderRadius: 12, 
                padding: '16px 32px', 
                fontWeight: 600, 
                cursor: (loading || uploadingImage) ? 'not-allowed' : 'pointer',
                fontSize: 16,
                transition: 'all 0.2s ease',
                boxShadow: (loading || uploadingImage) ? 'none' : '0 4px 16px rgba(79,142,247,0.3)',
                flex: 1
              }}
              onMouseEnter={e => !(loading || uploadingImage) && (e.target.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => !(loading || uploadingImage) && (e.target.style.transform = 'translateY(0)')}
            >
              {loading ? '⏳ Saving...' : uploadingImage ? '� Processing...' : '�💾 Save Profile'}
            </button>
            {!isNewUser && (
              <button 
                type="button" 
                onClick={onCancel} 
                disabled={loading || uploadingImage}
                style={{ 
                  background: 'rgba(79,142,247,0.1)',
                  color: '#4F8EF7', 
                  border: '1px solid rgba(79,142,247,0.2)', 
                  borderRadius: 12, 
                  padding: '16px 32px', 
                  fontWeight: 600, 
                  cursor: (loading || uploadingImage) ? 'not-allowed' : 'pointer',
                  fontSize: 16,
                  transition: 'all 0.2s ease',
                  opacity: (loading || uploadingImage) ? 0.5 : 1
                }}
                onMouseEnter={e => {
                  if (!(loading || uploadingImage)) {
                    e.target.style.background = 'rgba(79,142,247,0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={e => {
                  if (!(loading || uploadingImage)) {
                    e.target.style.background = 'rgba(79,142,247,0.1)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      )}
      
      {message && (
        <div style={{ 
          color: message.includes('Error') || message.includes('should be') ? '#ef4444' : '#10b981', 
          marginTop: 20,
          padding: '12px 16px',
          borderRadius: 8,
          background: message.includes('Error') || message.includes('should be') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          border: `1px solid ${message.includes('Error') || message.includes('should be') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          fontWeight: 500
        }}>
          {message}
        </div>
      )}
    </div>
  );
}

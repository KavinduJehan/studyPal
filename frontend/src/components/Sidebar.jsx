
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const ChevronIcon = ({ open }) => (
  <span style={{ fontSize: 22, display: 'inline-block', transition: 'transform 0.3s' }}>
    {open ? <>&#10094;</> : <>&#10095;</>}
  </span>
);

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Tasks', path: '/tasks' },
  { label: 'Pomodoro', path: '/pomodoro' },
  { label: 'Diary', path: '/diary' },
  { label: 'Settings', path: '/settings' },
  { label: 'Profile', path: '/profile' },
];

// Sidebar removed. Use Navbar instead.
export default function Sidebar() {
  return null;
}

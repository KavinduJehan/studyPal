import api from './api';

export const register = async (data) => {
  const res = await api.post('/auth/register', data);
  const userId = res.data?.userId;
  if (userId) localStorage.setItem('userId', userId);
  return res.data;
};
export const getUserId = () => localStorage.getItem('userId');

export const login = async (data) => {
  const res = await api.post('/auth/login', data);
  const token = res.data?.token;
  const userId = res.data?.userId;
  const userName = res.data?.userName;
  const isNewUser = res.data?.isNewUser;
  
  if (token) localStorage.setItem('token', token);
  if (userId) localStorage.setItem('userId', userId);
  if (userName) localStorage.setItem('userName', userName);
  localStorage.setItem('isNewUser', isNewUser ? 'true' : 'false');
  
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('userName');
  localStorage.removeItem('isNewUser');
};

export const getToken = () => localStorage.getItem('token');
export const getUserName = () => localStorage.getItem('userName');
export const getIsNewUser = () => localStorage.getItem('isNewUser') === 'true';

const auth = { register, login, logout, getToken, getUserId, getUserName, getIsNewUser };
export default auth;

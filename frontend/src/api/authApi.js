// src/api/authApi.js
import axiosClient from './axiosClient';

export const signup = async ({ name, email, password }) => {
  const res = await axiosClient.post('/api/auth/signup', {
    name,
    email,
    password,
  });
  return res.data; // { user, token }
};

export const login = async ({ email, password }) => {
  const res = await axiosClient.post('/api/auth/login', {
    email,
    password,
  });
  return res.data; // { user, token }
};

export const getMe = async () => {
  const res = await axiosClient.get('/api/auth/me');
  return res.data; // { user }
};

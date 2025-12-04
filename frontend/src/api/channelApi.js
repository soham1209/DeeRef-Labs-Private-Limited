// src/api/channelApi.js
import axiosClient from './axiosClient';

export const fetchChannels = async () => {
  const res = await axiosClient.get('/api/channels');
  // Map backend `_id` to `id` for frontend
  const channels = res.data.channels.map((c) => ({
    ...c,
    id: c._id,
  }));
  return channels;
};

export const createChannelApi = async ({ name, description,isPrivate }) => {
  const res = await axiosClient.post('/api/channels', {
    name,
    description,
    isPrivate,
  });
  const c = res.data.channel;
  return { ...c, id: c._id };
};

export const joinChannelApi = async (channelId) => {
  const res = await axiosClient.post(`/api/channels/${channelId}/join`);
  const c = res.data.channel;
  return { ...c, id: c._id };
};

export const leaveChannelApi = async (channelId) => {
  const res = await axiosClient.post(`/api/channels/${channelId}/leave`);
  const c = res.data.channel;
  return { ...c, id: c._id };
};
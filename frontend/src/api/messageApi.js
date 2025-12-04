// src/api/messageApi.js
import axiosClient from './axiosClient';

export const fetchChannelMessages = async (channelId, { limit = 20, before } = {}) => {
  const res = await axiosClient.get(`/api/channels/${channelId}/messages`, {
    params: { limit, before },
  });

  const { messages, hasMore, nextCursor } = res.data;

  const mapped = messages.map((m) => ({
    id: m._id,
    userId: m.sender,           // backend field
    text: m.text,
    timestamp: m.createdAt,
  }));

  return { messages: mapped, hasMore, nextCursor };
};

export const sendChannelMessage = async (channelId, text) => {
  const res = await axiosClient.post(`/api/channels/${channelId}/messages`, {
    text,
  });

  const m = res.data.message;
  return {
    id: m._id,
    userId: m.sender,
    text: m.text,
    timestamp: m.createdAt,
  };
};

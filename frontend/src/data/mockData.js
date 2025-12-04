// src/data/mockData.js
export const USERS = [
  { id: 'u1', name: 'Alex Rivero', avatar: 'https://i.pravatar.cc/150?u=1', status: 'online' },
  { id: 'u2', name: 'Sarah Chen', avatar: 'https://i.pravatar.cc/150?u=2', status: 'busy' },
  { id: 'u3', name: 'Mike Ross', avatar: 'https://i.pravatar.cc/150?u=3', status: 'offline' },
  { id: 'u4', name: 'Jessica Pearson', avatar: 'https://i.pravatar.cc/150?u=4', status: 'online' },
  { id: 'u5', name: 'Louis Litt', avatar: 'https://i.pravatar.cc/150?u=5', status: 'online' },
];

export const INITIAL_CHANNELS = [
  { id: 'c1', name: 'general', unread: 0, description: 'Company-wide announcements and general chatter.' },
  { id: 'c2', name: 'engineering', unread: 3, description: 'Tech talk, code reviews, and deployment updates.' },
  { id: 'c3', name: 'design', unread: 0, description: 'UI/UX discussions and critiques.' },
  { id: 'c4', name: 'random', unread: 12, description: 'Memes, pets, and non-work banter.' },
];

export const generateMockMessages = (channelId) => {
  return Array.from({ length: 15 }).map((_, i) => ({
    id: `m-${channelId}-${i}`,
    userId: USERS[i % USERS.length].id,
    text: `This is a simulated message ${i + 1} for channel #${channelId}. We are discussing important project details here.`,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * (15 - i)).toISOString(),
  }));
};

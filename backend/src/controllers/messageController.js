// src/controllers/messageController.js
import Channel from '../models/Channel.js';
import Message from '../models/Message.js';

// GET /api/channels/:channelId/messages?limit=20&before=<ISO or timestamp>
export const getChannelMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { limit = 20, before } = req.query;

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = req.user._id;
    if (channel.isPrivate && !channel.members.some((m) => m.equals(userId))) {
      return res
        .status(403)
        .json({ message: 'You are not a member of this private channel' });
    }

    const query = { channel: channelId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const msgs = await Message.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    const messages = msgs.reverse();

    let hasMore = false;
    if (msgs.length === Number(limit)) {
      const oldest = msgs[msgs.length - 1];
      const olderCount = await Message.countDocuments({
        channel: channelId,
        createdAt: { $lt: oldest.createdAt },
      });
      hasMore = olderCount > 0;
    }

    res.json({
      messages,
      hasMore,
      nextCursor: messages.length ? messages[0].createdAt : null,
    });
  } catch (err) {
    console.error('getChannelMessages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// POST /api/channels/:channelId/messages
export const createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    // Optionally: ensure user is member
    if (!channel.members.some((m) => m.equals(req.user._id))) {
      return res.status(403).json({ message: 'You are not a member of this channel' });
    }

    const message = await Message.create({
      channel: channelId,
      sender: req.user._id,
      text: text.trim(),
    });

    res.status(201).json({ message });
  } catch (err) {
    console.error('createMessage error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

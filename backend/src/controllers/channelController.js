// src/controllers/channelController.js
import Channel from '../models/Channel.js';

// GET /api/channels
export const getChannels = async (req, res) => {
  try {
    const userId = req.user._id;

    // Public channels OR channels where user is a member
    const channels = await Channel.find({
      $or: [
        { isPrivate: false },
        { members: userId },
      ],
    }).sort('name');

    res.json({ channels });
  } catch (err) {
    console.error('getChannels error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// POST /api/channels
export const createChannel = async (req, res) => {
  try {
    const { name, description, isPrivate = false } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Channel name is required' });
    }

    const existing = await Channel.findOne({ name: name.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Channel name already exists' });
    }

    const channel = await Channel.create({
      name: name.toLowerCase(),
      description: description || '',
      isPrivate: !!isPrivate,
      createdBy: req.user._id,
      members: [req.user._id], // creator is first member
    });

    res.status(201).json({ channel });
  } catch (err) {
    console.error('createChannel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/channels/:id
export const getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = req.user._id;

    if (channel.isPrivate && !channel.members.some((m) => m.equals(userId))) {
      return res.status(403).json({ message: 'You are not a member of this private channel' });
    }

    res.json({ channel });
  } catch (err) {
    console.error('getChannelById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// POST /api/channels/:id/join
export const joinChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = req.user._id;

    // ❗ rule: you can only join public channels via this endpoint
    if (channel.isPrivate) {
      return res
        .status(403)
        .json({ message: 'This is a private channel. You need an invite.' });
    }

    if (!channel.members.some((m) => m.equals(userId))) {
      channel.members.push(userId);
      await channel.save();
    }

    res.json({ channel });
  } catch (err) {
    console.error('joinChannel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// POST /api/channels/:id/leave
export const leaveChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);
    if (!channel) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const userId = req.user._id;

    channel.members = channel.members.filter((m) => !m.equals(userId));
    await channel.save();

    res.json({ channel });
  } catch (err) {
    console.error('leaveChannel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

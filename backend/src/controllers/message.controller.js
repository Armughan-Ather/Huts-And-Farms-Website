import db from '../models/index.js';

const { Message, Session } = db;

// Delete all messages for a specific user
export const deleteUserMessages = async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Delete all messages for the user
    const deletedMessagesCount = await Message.destroy({
      where: {
        user_id: user_id
      }
    });

    // Delete session entry for the user
    const deletedSessionsCount = await Session.destroy({
      where: {
        user_id: user_id
      }
    });

    console.log(`Deleted ${deletedMessagesCount} messages and ${deletedSessionsCount} sessions for user ${user_id}`);

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedMessagesCount} messages and ${deletedSessionsCount} sessions`,
      deletedCount: {
        messages: deletedMessagesCount,
        sessions: deletedSessionsCount
      }
    });

  } catch (error) {
    console.error('Error deleting user messages and sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete messages and sessions',
      details: error.message
    });
  }
};

// Get message count for a user (optional - for confirmation dialog)
export const getUserMessageCount = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const messageCount = await Message.count({
      where: {
        user_id: user_id
      }
    });

    return res.status(200).json({
      success: true,
      messageCount: messageCount
    });

  } catch (error) {
    console.error('Error getting user message count:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get message count',
      details: error.message
    });
  }
};
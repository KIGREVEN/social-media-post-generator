const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://social-media-post-generator-backend.onrender.com';

// Helper function to get JWT token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const schedulerApi = {
  // Schedule a new post
  schedulePost: async (postData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduler/schedule`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error scheduling post:', error);
      throw error;
    }
  },

  // Schedule an existing post
  scheduleExistingPost: async (postData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduler/schedule-existing`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule existing post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error scheduling existing post:', error);
      throw error;
    }
  },

  // Get all scheduled posts
  getScheduledPosts: async (status = null) => {
    try {
      let url = `${API_BASE_URL}/api/scheduler/scheduled`;
      if (status) {
        url += `?status=${status}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get scheduled posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting scheduled posts:', error);
      throw error;
    }
  },

  // Cancel a scheduled post
  cancelScheduledPost: async (postId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduler/scheduled/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel scheduled post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error cancelling scheduled post:', error);
      throw error;
    }
  },

  // Reschedule a post
  reschedulePost: async (postId, newScheduleData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduler/scheduled/${postId}/reschedule`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(newScheduleData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reschedule post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rescheduling post:', error);
      throw error;
    }
  },

  // Manually trigger processing of scheduled posts (for testing)
  processScheduledPosts: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/scheduler/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process scheduled posts');
      }

      return await response.json();
    } catch (error) {
      console.error('Error processing scheduled posts:', error);
      throw error;
    }
  },
};


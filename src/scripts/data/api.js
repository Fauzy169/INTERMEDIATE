import CONFIG from '../config';

const ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  STORIES: `${CONFIG.BASE_URL}/stories`,
  STORIES_GUEST: `${CONFIG.BASE_URL}/stories/guest`,
  STORIES_WITH_LOCATION: (page, size) => 
    `${CONFIG.BASE_URL}/stories?location=1&page=${page}&size=${size}`,
  NOTIFICATION_SUBSCRIBE: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

const checkResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  
  const data = await response.json();
  
  // Validate expected structure for story detail
  if (window.location.hash.includes('stories/') && !data.story) {
    throw new Error('Invalid API response structure - missing story data');
  }
  
  return data;
};

export const register = async (data) => {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return checkResponse(response);
};

export const login = async (data) => {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return checkResponse(response);
};

export const getStories = async (page = 1, size = 10) => {
  const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ENDPOINTS.STORIES}?page=${page}&size=${size}`, {
    headers
  });
  return checkResponse(response);
};

export const getStoriesWithLocation = async (page = 1, size = 10) => {
  const token = localStorage.getItem(CONFIG.USER_TOKEN_KEY);
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(ENDPOINTS.STORIES_WITH_LOCATION(page, size), {
    headers
  });
  return checkResponse(response);
};

export const getStoryDetail = async (id, token = null) => {
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
    headers
  });
  return checkResponse(response);
};

export const addStory = async (formData, token) => {
  try {
    const response = await fetch(`${ENDPOINTS.STORIES}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add story');
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Story added successfully',
      data: data
    };
  } catch (error) {
    console.error('Add story error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export const addStoryAsGuest = async (formData) => {
  try {
    const response = await fetch(ENDPOINTS.STORIES_GUEST, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add story as guest');
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Story added successfully as guest',
      data: data
    };
  } catch (error) {
    console.error('Add story as guest error:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

export const subscribePushNotification = async (subscription, token) => {
  const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  });
  return checkResponse(response);
};

export const unsubscribePushNotification = async (endpoint, token) => {
  const response = await fetch(ENDPOINTS.NOTIFICATION_SUBSCRIBE, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return checkResponse(response);
};


import axios from 'axios';

const base_url = process.env.BASE_URL || 'http://localhost:5000';

const getToken = () => {
  return localStorage.getItem('token');
};

const axiosInstance = axios.create({
  baseURL: base_url, // Replace with your API base URL
});

const makeAuthenticatedRequest = async (method, url, data = null) => {
    const token = getToken();
  
    if (!token) {
      throw new Error('No token found. User is not authenticated.');
    }
  
    try {
      const response = await axiosInstance({
        method,
        url,
        data,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.data) {
        throw new Error(`API request failed: ${error.response.data.message}`);
      } else if (error.message) {
        throw new Error(`API request failed: ${error.message}`);
      } else {
        throw new Error('API request failed.');
      }
    }
  };
  

export { makeAuthenticatedRequest };

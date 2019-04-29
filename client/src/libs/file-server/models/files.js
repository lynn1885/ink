import axios from 'axios';

const Files = {
  async get(serverUrl, path) {
    return axios.get(`${serverUrl}files`, {
      params: { path },
    });
  },

  async update(serverUrl, data) {
    return axios.put(`${serverUrl}files/`, data, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  },
};

export default Files;

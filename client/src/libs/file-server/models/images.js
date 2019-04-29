import axios from 'axios';

const Images = {
  async upload(serverUrl, formData) {
    return axios.post(`${serverUrl}images`, formData, {
      headers: { 'content-type': 'multipart/form-data' },
    });
  },
};

export default Images;

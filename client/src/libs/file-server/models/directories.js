import axios from 'axios';

const Directories = {
  async get(serverUrl) {
    return axios.get(`${serverUrl}directories`);
  },
};

export default Directories;

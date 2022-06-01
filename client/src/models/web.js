import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const Web = {
  async getWebsite(url, messager) {
    let data;
    await axios.get(`${serverUrl}web`, {
      params: {
        url
      }
    })
      .then((res) => {
        if (res.status === 200) {
          ({ data } = res);
        } else {
          if (messager) {
            messager.error(`Web.getWebsite(), Bad Http Status: ${res}`);
          }
          throw new Error(`Web.getWebsite(), Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`Web.getWebsite(), Get Website Failed: ${err}`);
        }
        throw new Error(`Web.getWebsite(), Get Website Failed: ${err}`);
      });
    return data;
  },
};

export default Web;

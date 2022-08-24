import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const Images = {
  /**
   * uploadImage
   * @param {Object} formData image object
   * @param {Function} messager messager function
   */
  async upload(formData, messager) {
    let data;
    if (!formData) {
      throw new Error(`uploadImage, illegal formData: ${formData}`);
    }
    await axios.post(`${serverUrl}images`, formData, {
      headers: { 'content-type': 'multipart/form-data' },
    })
      .then((res) => {
        if (res.status === 200) {
          ({ data } = res);
          console.log('[image uploaded]');
        } else {
          if (messager) {
            messager.error(`Images.upload(), Bad Http Status: ${res}`);
          }
          throw new Error(`Images.upload(), Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`Images.upload(), Update Failed: ${err}`);
        }
        throw new Error(`Images.upload(), Update Failed: ${err}`);
      });
    return data;
  },


  async getIllustrations(keyword, messager) {
    let data;
    await axios.get(`${serverUrl}images`, {
      params: {
        type: 'illustration',
        keyword,
      }
    })
      .then((res) => {
        if (res.status === 200) {
          ({ data } = res);
        } else {
          if (messager) {
            messager.error(`Images.getIllustrations(), Bad Http Status: ${res}`);
          }
          throw new Error(`Images.getIllustrations(), Bad Http Status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`Images.getIllustrations(), Get Illustrations Failed: ${err}`);
        }
        throw new Error(`Images.getIllustrations(), Get Illustrations Failed: ${err}`);
      });
    return data;
  },
};

export default Images;

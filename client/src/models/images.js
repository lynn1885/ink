import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const Images = {
  /**
  * uploadImage: 上传图片
  * @param formData formData 图片对象
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
};

export default Images;

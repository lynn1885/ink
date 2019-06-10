/**
 * 前端的UserConfig只有get和set接口, 不区分default-config和user-config
 * get获取的是merged-config
 */
import axios from 'axios';
import config from '@/config';

const { serverUrl } = config.server;

const UserConfig = {
  /**
  * getUserConfig 获取用户配置
  * @param {array} 要获取的路径数组
  * @param {function} 通知器, 可选
  * @return {object} 用户配置对象
  */
  async get(props, messager) {
    let userConfig = null;

    await axios.get(`${serverUrl}user-config`, {
      params: {
        props,
      },
    })
      .then((res) => {
        if (res.status === 200) {
          userConfig = res.data;
        } else {
          if (messager) {
            messager.error(`getUserConfig(): Bad HTTP status: ${res}`);
          }
          throw new Error(`getUserConfig(): Bad HTTP status: ${res}`);
        }
      })
      .catch((err) => {
        if (messager) {
          messager.error(`getUserConfig failed: ${err}`);
        }
        throw new Error(`getUserConfig failed: ${err}`);
      });
    return userConfig;
  },
};

export default UserConfig;

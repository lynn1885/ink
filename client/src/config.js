// 应用程序监听端口参见vue.config.js
import _ from 'lodash';
import userConfig from './user-config';

// default config
const defaultConfig = {
  // server
  server: {
    serverUrl: 'http://localhost:3001/',
    staticResUrl: 'http://localhost:3001/images/',
  },

  // theme: unavailable now
  theme: {

  },

  // catalog
  catalog: {
    // default open catalog
    defaultOpen: {
      lv1: 'mine',
      lv2: 'model',
      lv3: 'routine',
    },
    // catalog order
    order: {},
  },
};

// mix config: default config & user config
const mixedConfig = _.merge(defaultConfig, userConfig);

// export
export default mixedConfig;

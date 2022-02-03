import Vue from 'vue';
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import router from './router';
import store from './store';
import inkCommon from './tools/common';
import './assets/css/reset.scss';
import App from './App.vue';

// themes
import './themes/craft/index.scss';
// default-theme

Vue.use(ElementUI);
Vue.config.productionTip = false;

// 全局变量
Vue.prototype.inkCommon = inkCommon;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');

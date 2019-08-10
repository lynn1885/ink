import Vue from 'vue';
import { library } from '@fortawesome/fontawesome-svg-core'; // font-awesome core
import { faSearch, faTorah, faStream, faMoon, faStickyNote } from '@fortawesome/free-solid-svg-icons'; // fon-awesome icons
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'; // font-awesome for vue
import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import router from './router';
import store from './store';
import './assets/css/reset.scss';
import App from './App.vue';

Vue.use(ElementUI);
library.add(faSearch, faTorah, faStream, faMoon, faStickyNote);
Vue.component('font-awesome-icon', FontAwesomeIcon);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: h => h(App),
}).$mount('#app');

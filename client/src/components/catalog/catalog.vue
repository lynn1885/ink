/* eslint-disable import/no-unresolved */
/**
 * 1. 目录结构硬编码为3层, 且和后端接口耦合, 较难修改
 * 2. 为了保证数据流动的简洁性
 * 所有对后端的写操作, 包括: 创建目录, 重命名, 目录排序. 都先修改后端, 然后重新获取后端数据, 前端再应用更新
 */

<template>
  <div id="catalog" v-if="isCatalogLoaded">
    <!-- 仅用于测试是否存在默认icon -->
    <img :src="defaultIconUrl" @error="defaultImgLoadError" v-show="false">

    <!-- 一级目录 -->
    <ul
      class="catalog-container"
      id="catalog-level-1"
      @contextmenu="showCatalogContextMenu($event, 1)"
    >
      <li
        v-for="(cat, index) of catsLv1"
        :key="cat"
        :title="cat"
        :class="{
          'cat-active': curCatLv1 === cat,
          'cat-dragover-active': draggedCatLv === 2 && droppedCatLv === 1 && droppedCatName === cat,
          'cat-dragover-top-active': draggedCatLv === 1 && droppedCatLv === 1 && droppedCatName === cat && dropHalf === 'TOP',
          'cat-dragover-bottom-active': draggedCatLv === 1 && droppedCatLv === 1 && droppedCatName === cat && dropHalf === 'BOTTOM'
        }"
        draggable="true"
        @click="changeCurCat(1, cat)"
        @contextmenu="showCatalogContextMenu($event, 1, cat, index)"
        @dragstart="catalogDragStart($event, 1, cat, index)"
        @dragend="catalogDragEnd($event)"
        @dragenter="catalogDragEnterLv1($event)"
        @dragover="catalogDragOverLv1($event, 1, cat, index)"
        @dragleave="catalogDragLeave"
        @drop="catalogDropLv1($event, 1, cat, index)"
      >
        <img
          :src="`${staticIconUrl}/${cat}.png`"
          v-if="isShowCatIcon"
          @error="imgLoadError"
          class="catalog-icon"
        >
          {{cat}}
      </li>
    </ul>

    <!-- 二级目录 -->
    <ul
      class="catalog-container"
      id="catalog-level-2"
      @contextmenu="showCatalogContextMenu($event, 2)"
    >
      <li
        v-for="(cat, index) of catsLv2"
        :key="cat"
        :title="cat"
        :class="{
          'cat-active': curCatLv2 === cat,
          'cat-dragover-active': draggedCatLv === 3 && droppedCatLv === 2 && droppedCatName === cat,
          'cat-dragover-top-active': draggedCatLv === 2 && droppedCatLv === 2 && droppedCatName === cat && dropHalf === 'TOP',
          'cat-dragover-bottom-active': draggedCatLv === 2 && droppedCatLv === 2 && droppedCatName === cat && dropHalf === 'BOTTOM'
        }"
        draggable="true"
        @click="changeCurCat(2, cat)"
        @contextmenu="showCatalogContextMenu($event, 2, cat, index)"
        @dragstart="catalogDragStart($event, 2, cat, index)"
        @dragend="catalogDragEnd($event)"
        @dragenter="catalogDragEnterLv2($event)"
        @dragover="catalogDragOverLv2($event, 2, cat, index)"
        @dragleave="catalogDragLeave"
        @drop="catalogDropLv2($event, 2, cat, index)"
      >
        <img
          :src="`${staticIconUrl}/${cat}.png`"
          v-if="isShowCatIcon"
          @error="imgLoadError"
          class="catalog-icon"
        >
        {{cat}}
      </li>
    </ul>

    <!-- 三级目录 -->
    <ul
      class="catalog-container"
      id="catalog-level-3"
      @contextmenu="showCatalogContextMenu($event, 3)"
    >
      <li
        v-for="(cat, index) of catsLv3"
        :key="cat"
        :title="cat"
        :class="{
          'cat-active': curCatLv3 === cat,
          'cat-dragover-top-active': draggedCatLv === 3 && droppedCatLv === 3 &&  droppedCatName === cat && dropHalf === 'TOP',
          'cat-dragover-bottom-active': draggedCatLv === 3 && droppedCatLv === 3 &&  droppedCatName === cat && dropHalf === 'BOTTOM'
        }"
        draggable="true"
        @click="changeCurCat(3, cat)"
        @contextmenu="showCatalogContextMenu($event, 3, cat, index)"
        @dragstart="catalogDragStart($event, 3, cat, index)"
        @dragend="catalogDragEnd($event)"
        @dragenter="catalogDragEnterLv3($event)"
        @dragover="catalogDragOverLv3($event, 3, cat, index)"
        @dragleave="catalogDragLeave"
        @drop="catalogDropLv3($event, 3, cat, index)"
      >
        <img
          :src="`${staticIconUrl}/${cat}.png`"
          v-if="isShowCatIcon"
          @error="imgLoadError"
          class="catalog-icon"
        >
        {{cat}}
      </li>
    </ul>

    <!-- 模态框 -->
    <div id="catalog-modal" v-show="$store.state.isProhibitOperateCat"></div>

    <!-- 目录跳转 -->
    <div id="catalog-jump" v-show="isShowCatalogJump">
      <input
        class="catalog-jump-input"
        type="text"
        v-model="catalogJumpSearchStr"
        ref="catalog-jump-input"
      >
      <ul
        class="catalog-jump-result"
        v-for="curRes of catalogJumpSearchRes"
        :key="curRes.toString()"
      >
        <li
          @click="jumpCatalog(curRes)"
          :class="{'selected-search-res':
          curRes === catalogJumpSearchRes[0 + curSelectedSearchResBias]}"
        >
          {{curRes}}
        </li>
      </ul>
    </div>

    <!-- 上下文菜单-->
    <content-menu
      v-show="isShowContentMenu"
      :style="{'left': contentMenuLeft, 'top': contentMenuTop}"
    >
      <template slot="menu-list">
        <li
          v-for="menu of curContentMenu"
          :key="menu"
          @click="handleContentMenu(menu)"
        >
          {{menu}}
        </li>
      </template>
    </content-menu>

  </div>
</template>
<script>
import config from '@/config';
import Directories from '@/models/directories';
import ContentMenu from '@/components/content-menu/content-menu.vue';
import tools from '@/tools/tools';

export default {
  name: 'catalog',
  components: {
    ContentMenu,
  },
  data() {
    return {
      // 基础
      isCatalogLoaded: false, // 目录是否加载完毕
      curCatLv1: '', // 当前路径
      curCatLv2: '',
      curCatLv3: '',
      waitOpenCatLv1: '', // 等待打开的目录. 一般的, 用于当前页面更新后自动重定位至某个目录
      waitOpenCatLv2: '',
      waitOpenCatLv3: '',
      catalog: [], // 总目录
      catsLv1: [], // 各级目录
      catsLv2: [],
      catsLv3: [],
      isConAvailableLv2: false, // 二级菜单容器是否可用
      isConAvailableLv3: false,
      // 右键菜单
      isShowContentMenu: false, // 是否显示右键菜单
      contentMenuLeft: '', // 右键菜单位置
      contentMenuTop: '',
      contentMenuCat: ['create before', 'create after', 'rename', 'delete'], // 目录的右键菜单
      contentMenuContainer: ['create'], // 目录容器的右键菜单
      curContentMenu: [], // 当前右键菜单
      curContentMenuCatLv: null, // 当前右键菜单对应的目录等级
      curContentMenuCatName: null, // 当前右键菜单对应的目录名
      curContentMenuCatIndex: null, // 当前右键菜单对应的目录下标
      // 拖动
      draggedCatLv: null, // 源目录: 被拖动的目录的信息记录
      draggedCatName: null,
      draggedCatIndex: null,
      droppedCatLv: null, // 目标目录: 接收到降落的目标目录的信息记录
      droppedCatName: null,
      droppedCatIndex: null,
      catalogHalfHeight: null, // 目录高度的一半. 用于计算降落是降落在上半边还是下半边
      dropHalf: null, // 降落位置, 可取值: 'TOP', 'BOTTOM'. 在把子目录拖入兄弟目录的dragover中, 会实时修改该属性
      catalogDragEnterLv1: null, // 目录的DragEnter回调
      catalogDragEnterLv2: null,
      catalogDragEnterLv3: null,
      catalogDragOverLv1: null, // 目录的DragOver回调
      catalogDragOverLv2: null,
      catalogDragOverLv3: null,
      catalogDropLv1: null, // 目录的Drop回调
      catalogDropLv2: null,
      catalogDropLv3: null,
      // 目录跳转
      isShowCatalogJump: false, // 是否显示目录跳转
      curSelectedSearchResBias: 0, // 当前选中的目录搜索结果的偏移值, 默认选中第一个搜索结果
      catalogJumpSearchStr: '', // 目录跳转搜索字符串
      catalogJumpSearchRes: [], // 目录跳转搜索结果
      // 图标
      isShowCatIcon: true, // 是否显示目录图标
      isHasDefaultIcon: true, // 是否存在默认icon
      staticIconUrl: config.server.staticIconUrl, // 图标url, 从这个地址读取catalog中的图标
      defaultIconUrl: `${config.server.staticIconUrl}_default.png`, // 默认图标地址, 没有对应图标时会使用该图标
    };
  },

  /**
   * 目录的ui变更, 选中文件的变更, 基本依赖于此时的监听机制
   * 想要切换目录时, 请通过触发此处的监听来进行切换
   */
  watch: {
    // 监听: 总目录变更时, 更新一级目录
    catalog() {
      this.updateCatalog(1);
    },

    // 监听: 选中的一级路径变更, 更新二级目录
    curCatLv1(value) {
      // 只有选中一级菜单时, 才标记二级菜单容器可用. 比如, 二级菜单未选中时, 不能在二级菜单右键
      // eslint-disable-next-line no-unneeded-ternary
      this.isConAvailableLv2 = value ? true : false;
      this.updateCatalog(2);
    },

    // 监听: 选中的二级路径变更, 更新三级目录
    curCatLv2(value) {
      // 只有选中二级菜单时, 才标记三级菜单容器可用. 比如, 二级菜单未选中时, 不能在三级菜单右键
      // eslint-disable-next-line no-unneeded-ternary
      this.isConAvailableLv3 = value ? true : false;
      this.updateCatalog(3);
    },

    // 监听: 选中的三级路径变更时, 更新页面. 此时才会触发真正的文件加载
    async curCatLv3(value) {
      if (value) {
        await this.$store.state.editor.runCommand(
          'OPENFILE',
          `${this.curCatLv1}/${this.curCatLv2}/${this.curCatLv3}/${this.curCatLv3}.md`,
        );
      }
    },

    // 目录跳转: 及时搜索
    catalogJumpSearchStr() {
      this.updateCatalogJumpSearchRes(this.catalogJumpSearchStr);
    },

    // 目录跳转: 关闭时, 做一些清理工作
    isShowCatalogJump(value) {
      if (value === false) {
        this.catalogJumpSearchStr = '';
        this.catalogJumpSearchRes = [];
      }
    },
  },

  methods: {
    // 目录: 获取目录
    async getCatalog() {
      // 从后端获取目录
      this.catalog = await Directories.get(this.$message);
      // 标记目录加载完毕
      this.isCatalogLoaded = true;

      // 设置默认打开的1, 2, 3级目录
      // 因为设置各级目录时都有对应的监听事件, 所以把设置1, 2, 3级目录放在不同的事件循环中
      // 确保当前目录等级的监听事件发生后, 在设置下一级的目录
      // 如果存在waitOpenCatLv1, 则默认打开waitOpenCat系列的目录, 否则默认打开各级的第一个目录
      setTimeout(() => {
        if (this.waitOpenCatLv1) {
          this.curCatLv1 = this.waitOpenCatLv1;
        } else if (typeof this.catalog === 'object') {
          [this.curCatLv1] = Object.keys(this.catalog);
        }
        setTimeout(() => {
          if (this.waitOpenCatLv1) {
            this.curCatLv2 = this.waitOpenCatLv2;
          } else if (this.curCatLv1 && typeof this.catalog[this.curCatLv1] === 'object') {
            [this.curCatLv2] = Object.keys(this.catalog[this.curCatLv1]);
          }
          setTimeout(() => {
            if (this.waitOpenCatLv1) {
              this.curCatLv3 = this.waitOpenCatLv3;
            } else if (this.curCatLv1 && this.curCatLv2 && typeof this.catalog[this.curCatLv1][this.curCatLv2] === 'object') {
              [this.curCatLv3] = Object.keys(this.catalog[this.curCatLv1][this.curCatLv2]);
            }
          }, 0);
        }, 0);
      }, 0);
    },

    // 目录: 更新目录 (当选中目录变更时, 更新下级目录)
    updateCatalog(lv) {
      if (lv === 1) { // 总目录变更, 需要更新当前一级目录列表
        this.curCatLv1 = ''; // 总目录变更, 则需要把当前选中的一二三级目录都清空
        this.curCatLv2 = '';
        this.curCatLv3 = '';
        this.catsLv1 = this.catalog ? Object.keys(this.catalog) : [];
      } else if (lv === 2) { // 一级目录变更, 需要更新当前二级目录列表
        this.curCatLv2 = ''; // 一级目录变更, 则需要把当前选中的二三级目录清空
        this.curCatLv3 = '';
        this.catsLv2 = this.curCatLv1 && typeof this.catalog[this.curCatLv1] === 'object'
          ? Object.keys(this.catalog[this.curCatLv1])
          : [];
      } else if (lv === 3) { // 二级目录变更, 需要更新当前三级目录列表
        this.curCatLv3 = null; // 三级目录变更, 则需要把当前选中的三级目录清空
        this.catsLv3 = this.curCatLv2 &&
          typeof this.catalog[this.curCatLv1][this.curCatLv2] === 'object'
          ? Object.keys(this.catalog[this.curCatLv1][this.curCatLv2])
          : [];
      }
    },

    // 目录: 更改当前选中的目录. 当目录被点击时会被调用
    changeCurCat(lv, value) {
      if (lv === 1) {
        this.curCatLv1 = value;
      } else if (lv === 2) {
        this.curCatLv2 = value;
      } else if (lv === 3) {
        this.curCatLv3 = value;
      }
    },

    // icon: icon加载失败时, 尝试加载默认icon, 或不显示icon
    imgLoadError(e) {
      if (this.isHasDefaultIcon) {
        e.target.src = this.defaultIconUrl;
      } else {
        e.target.style.visibility = 'hidden';
      }
    },

    // icon: 默认icon加载失败时
    defaultImgLoadError() {
      this.isHasDefaultIcon = false;
    },

    // 目录跳转: 搜索目录
    updateCatalogJumpSearchRes(searchStr) {
      this.catalogJumpSearchRes = [];
      const res = [];
      if (searchStr) {
        for (const cat1 in this.catalog) {
          for (const cat2 in this.catalog[cat1]) {
            for (const cat3 in this.catalog[cat1][cat2]) {
              if (cat1.toLowerCase().includes(searchStr.toLowerCase())) {
                const r = cat1;
                res.push(r);
              }
              if (cat2.toLowerCase().includes(searchStr.toLowerCase())) {
                const r = `${cat1} > ${cat2}`;
                res.push(r);
              }
              if (cat3.toLowerCase().includes(searchStr.toLowerCase())) {
                const r = `${cat1} > ${cat2} > ${cat3}`;
                res.push(r);
              }
            }
          }
        }
      }
      this.catalogJumpSearchRes = Array.from(new Set(res));
    },

    // 目录跳转: 跳转
    jumpCatalog(catStr) {
      if (typeof catStr !== 'string') {
        return;
      }
      const aimCats = catStr.split(' > ');
      if (aimCats[0]) {
        [this.curCatLv1] = aimCats;
      }
      setTimeout(() => {
        if (aimCats[1]) {
          [, this.curCatLv2] = aimCats;
        }
        setTimeout(() => {
          if (aimCats[2]) {
            [, , this.curCatLv3] = aimCats;
          }
        }, 0);
      }, 0);
      this.isShowCatalogJump = false;
    },

    // 右键菜单: 显示右键菜单
    showCatalogContextMenu(e, catLv, catName, catIndex) {
      this.isShowContentMenu = false; // 首先关闭其他右键菜单
      e.preventDefault();
      e.stopPropagation(); // 不向上传播, 防止右键时同时触发目录右键菜单和容器右键菜单

      // 如果没有选中一级菜单, 此时二级菜单没有打开, 则不能在二级右键. 如果没有选中二级菜单, 也不能在三级菜单右键
      if (catLv > 1 && !this[`isConAvailableLv${catLv}`]) return;

      // 显示右键菜单
      this.contentMenuLeft = `${e.clientX}px`;
      this.contentMenuTop = `${e.clientY - 8}px`;
      if (catLv && catName) { // 目录右键, 在目录右键或容器右键, 都会把一些有用的信息绑定到this对象
        this.curContentMenu = this.contentMenuCat;
        this.curContentMenuCatLv = catLv;
        this.curContentMenuCatName = catName;
        this.curContentMenuCatIndex = catIndex;
      } else { // 容器右键
        this.curContentMenu = this.contentMenuContainer;
        this.curContentMenuCatLv = catLv;
        this.curContentMenuCatName = null;
        this.curContentMenuCatIndex = null;
      }
      this.isShowContentMenu = true;
    },

    // 右键菜单: 点击时关闭右键菜单
    closeCatalogContextMenuOnClick() {
      // 在任意地方点击时, 会关闭右键菜单, 并清理相关信息
      // 包括点击菜单中的选项, 也会触发关闭, 并触发信息清理
      // 不过因为清理事件是绑定在document的冒泡节点, 所以
      // 只要菜单选项处理绑定在document的子元素上, 就已经可以在清理前获得所需的信息
      document.addEventListener('click', () => {
        this.curContentMenu = null;
        this.curContentMenuCatLv = null;
        this.curContentMenuCatName = null;
        this.curContentMenuCatIndex = null;
        this.isShowContentMenu = false;
      });
    },

    // 右键菜单: 处理右键菜单
    async handleContentMenu(menu) {
      // 获取editor, 处理右键菜单前, 我们往往需要调用editor的save方法, 保存当前编辑中的文档
      if (!this.$store.state.editor) {
        this.$message({
          type: 'warning',
          message: '编辑器还在加载中, 暂时不能使用右键菜单哦',
        });
        return;
      }

      // 在处理右键任务时, 锁定菜单栏
      this.$store.commit('updateIsProhibitOperateCat', true);

      // 处理右键任务
      if (menu === 'create' || menu === 'create before' || menu === 'create after') {
        await this.createCat(menu);
      } else if (menu === 'delete') {
        await this.deleteCat();
      } else if (menu === 'rename') {
        await this.rename();
      }

      // 关闭菜单栏锁定
      this.$store.commit('updateIsProhibitOperateCat', false);
    },

    // 右键菜单: 创建目录
    async createCat(menu) {
      // 记录当前的右键菜单信息, 因为右键菜单消失后, 这些信息会被清除, 而该函数中又包含异步操作
      const { curContentMenuCatLv } = this;
      const { curContentMenuCatIndex } = this;

      // 弹出创建窗口
      let isCancelCreate = false;
      let newCatName;
      const catLvLowerCase = this[`catsLv${curContentMenuCatLv}`].map(item => item.toLowerCase());
      await this.$prompt('Create', '', {
        center: true,
        confirmButtonText: 'Create',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value) {
            return '目录名不能为空';
          } else if (!tools.isFileNameValid(value)) {
            return '目录名中不能包含 < > : " / \\ | ? * 等特殊字符, 且不能以 . 空格 开头或结尾';
          } else if (catLvLowerCase.includes(value.toLowerCase())) {
            return '目录名已存在';
          }
          return true;
        },
      })
        .then((data) => {
          newCatName = data.value;
        })
        .catch(() => {
          isCancelCreate = true;
        });
      if (isCancelCreate) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // 计算生成文件后的目录数组, 用于后端排序, 不会触发ui更新
      let catOrderAfterCreate = [];
      if (typeof curContentMenuCatIndex !== 'number') { // 触发的是容器菜单, 把新文件放在列表最底
        catOrderAfterCreate = this[`catsLv${curContentMenuCatLv}`].slice(); // 复制一份
        catOrderAfterCreate.push(newCatName);
      } else if (menu === 'create before') { // 触发的是目录菜单
        catOrderAfterCreate = this[`catsLv${curContentMenuCatLv}`].slice();
        catOrderAfterCreate = [].concat(
          catOrderAfterCreate.slice(0, curContentMenuCatIndex),
          newCatName,
          catOrderAfterCreate.slice(curContentMenuCatIndex),
        );
      } else if (menu === 'create after') {
        catOrderAfterCreate = this[`catsLv${curContentMenuCatLv}`].slice();
        catOrderAfterCreate = [].concat(
          catOrderAfterCreate.slice(0, curContentMenuCatIndex + 1),
          newCatName,
          catOrderAfterCreate.slice(curContentMenuCatIndex + 1),
        );
      }

      // 先保存文件
      if (this.curCatLv3) { // 如果已经打开了文件, 则先保存
        await this.$store.state.editor.runCommand('SAVE', { triggerType: 'CATALOG' });
      }
      // 如果存在已经打开的目录, 但创建的新目录不是三级目录
      // 按下面的逻辑, 会打开新创建的一级或二级目录, 则此时应该清理编辑器, 防止打开新创建的一二级目录后还能编辑旧的三级文件导致出错
      // 如果创建的是三级目录则不必清理, 按下面的逻辑, 编辑器会自动打开新创建的三级目录
      // 按上面的逻辑, 清理前打开的三级目录已经被保存了, 所以这个清理是安全的
      if (this.curCatLv3 && curContentMenuCatLv !== 3) {
        await this.$store.state.editor.runCommand('CLEAN');
      }

      // 向后台发送信息, 真正创建文件
      const ancestorCatNames = [];
      switch (curContentMenuCatLv) {
        case 2:
          ancestorCatNames.push(this.curCatLv1);
          break;
        case 3:
          ancestorCatNames.push(this.curCatLv1);
          ancestorCatNames.push(this.curCatLv2);
          break;
        default:
          break;
      }
      const data = {
        catLv: curContentMenuCatLv,
        catName: newCatName,
        ancestorCatNames,
        catOrderAfterCreate,
      };
      await Directories.create(data, this.$message);

      // 记录一会儿刷新后要打开的目录
      switch (curContentMenuCatLv) {
        case 1:
          this.waitOpenCatLv1 = newCatName;
          this.waitOpenCatLv2 = '';
          this.waitOpenCatLv3 = '';
          break;
        case 2:
          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = newCatName;
          this.waitOpenCatLv3 = '';
          break;
        case 3:
          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = this.curCatLv2;
          this.waitOpenCatLv3 = newCatName;
          break;
        default:
          break;
      }

      // 重新从后端获取目录, 触发前端更新
      await this.getCatalog();
    },

    // 右键目录: 删除目录
    async deleteCat() {
      // 记录当前的右键菜单信息, 因为右键菜单消失后, 这些信息会被清除, 而该函数中又包含异步操作
      const { curContentMenuCatLv } = this;
      const { curContentMenuCatName } = this;

      // 获取要删除的目录
      let isDeleteCurOpenFile = false;
      const paths = [];
      switch (curContentMenuCatLv) {
        case 1:
          paths.push(curContentMenuCatName);
          if (this.curCatLv1 === curContentMenuCatName && this.curCatLv3) isDeleteCurOpenFile = true;
          break;
        case 2:
          paths.push(this.curCatLv1);
          paths.push(curContentMenuCatName);
          if (this.curCatLv2 === curContentMenuCatName && this.curCatLv3) isDeleteCurOpenFile = true;
          break;
        case 3:
          paths.push(this.curCatLv1);
          paths.push(this.curCatLv2);
          paths.push(curContentMenuCatName);
          if (this.curCatLv3 === curContentMenuCatName) isDeleteCurOpenFile = true;
          break;
        default:
          break;
      }

      // 弹出确认窗口
      let isCancelDelete = false;
      await this.$confirm(`Delete ${paths.join('/')}`, '', {
        type: 'warning',
        center: true,
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
      }).catch(() => {
        isCancelDelete = true;
      });
      if (isCancelDelete) {
        return;
      }

      // 先保存文件
      if (isDeleteCurOpenFile) { // 如果当前打开的文件要被删除, 则不再保存, 直接清理编辑器
        await this.$store.state.editor.runCommand('CLEAN');
      } else if (this.curCatLv3) { // 如果当前打开的有文件, 先保存
        await this.$store.state.editor.runCommand('SAVE', { triggerType: 'CATALOG' });
      }

      // 向后台发送信息, 真正删除文件
      await Directories.delete(paths, this.$message);

      // 记录一会儿刷新后要打开的目录
      switch (curContentMenuCatLv) {
        case 1:
          this.waitOpenCatLv1 = this.curCatLv1 === curContentMenuCatName ? this.catsLv1[0] : this.curCatLv1;
          this.waitOpenCatLv2 = this.curCatLv1 === curContentMenuCatName ? '' : this.curCatLv2;
          this.waitOpenCatLv3 = this.curCatLv1 === curContentMenuCatName ? '' : this.curCatLv3;
          break;
        case 2:
          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = this.curCatLv2 === curContentMenuCatName ? '' : this.curCatLv2;
          this.waitOpenCatLv3 = this.curCatLv2 === curContentMenuCatName ? '' : this.curCatLv3;
          break;
        case 3:
          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = this.curCatLv2;
          this.waitOpenCatLv3 = this.curCatLv3 === curContentMenuCatName ? '' : this.curCatLv3;
          break;
        default:
          break;
      }

      // 重新从后端获取目录, 触发前端更新
      await this.getCatalog();
    },

    // 右键菜单: 重命名目录
    async rename() {
      // 记录当前的右键菜单信息, 因为右键菜单消失后, 这些信息会被清除, 而该函数中又包含异步操作
      const { curContentMenuCatLv } = this;
      const { curContentMenuCatName } = this;
      const { curContentMenuCatIndex } = this;

      // 设置要发送给后端的任务名
      const taskName = 'RENAME';

      // 弹出重命名窗口
      let isCancelRename = false;
      let newName;
      const catLvLowerCase = this[`catsLv${curContentMenuCatLv}`].map(item => item.toLowerCase());
      await this.$prompt(`Rename: ${curContentMenuCatName}`, '', {
        center: true,
        confirmButtonText: 'Rename',
        cancelButtonText: 'Cancel',
        inputValidator: (value) => {
          if (!value) {
            return '目录名不能为空';
          } else if (value === curContentMenuCatName) {
            return '新目录名和旧目录名一样';
          } else if (!tools.isFileNameValid(value)) {
            return '目录名中不能包含 < > : " / \\ | ? * 等特殊字符, 且不能以 . 开头或结尾';
          } else if (catLvLowerCase.includes(value.toLowerCase())) {
            return '目录名已存在';
          }
          return true;
        },
      })
        .then((data) => {
          newName = data.value;
        })
        .catch(() => {
          isCancelRename = true;
        });
      if (isCancelRename) {
        // eslint-disable-next-line no-useless-return
        return;
      }

      // 获取要重命名目录的祖先名
      const ancestorCatNames = [];
      switch (curContentMenuCatLv) {
        case 2:
          ancestorCatNames.push(this.curCatLv1);
          break;
        case 3:
          ancestorCatNames.push(this.curCatLv1);
          ancestorCatNames.push(this.curCatLv2);
          break;
        default:
          break;
      }

      // 获取重命名后的当前目录列表
      const catOrderAfterRename = this[`catsLv${curContentMenuCatLv}`];
      catOrderAfterRename[curContentMenuCatIndex] = newName;

      // 先保存正在编辑的文件
      if (this.curCatLv3) { // 如果已经打开了文件, 则先保存
        await this.$store.state.editor.runCommand('SAVE', { triggerType: 'CATALOG' });
      }
      // 当前正在编辑文件, 且重命名的不是当前正在编辑的文件, 则清空当前编辑器
      // 因为按下面的逻辑, 重命名之后会打开重命名文件或重命名目录. 所以这里要清空编辑器, 防止切换目录后还能编辑当前文件
      // 按上面的逻辑, 正在编辑文件会被保存, 所以这里可以放心清理
      if (this.curCatLv3 && curContentMenuCatName !== this[`curCatLv${curContentMenuCatIndex}`]) {
        await this.$store.state.editor.runCommand('CLEAN');
      }

      // 给后端发送信息
      await Directories.rename({
        task: taskName,
        ancestorCatNames,
        oldName: curContentMenuCatName,
        newName,
        catOrderAfterRename,
      }, this.$message);

      // 记录一会儿刷新后要打开的目录
      switch (curContentMenuCatLv) {
        case 1:
          this.waitOpenCatLv1 = newName;
          this.waitOpenCatLv2 = '';
          this.waitOpenCatLv3 = '';
          break;
        case 2:
          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = newName;
          this.waitOpenCatLv3 = '';
          break;
        case 3:
          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = this.curCatLv2;
          this.waitOpenCatLv3 = newName;
          break;
        default:
          break;
      }

      // 重新从后端获取目录, 触发前端更新
      await this.getCatalog();
    },

    // 拖动: 拖动开始时, 在被拖动的那个元素上触发一次. 所有目录都绑定该事件
    catalogDragStart(e, catLv, catName, catIndex) {
      // 记录被拖动的元素信息
      this.draggedCatLv = catLv;
      this.draggedCatName = catName;
      this.draggedCatIndex = catIndex;

      // 设置各级目录的拖动回调
      switch (catLv) {
        case 1:
          // 设置各级目录的dragenter回调
          this.catalogDragEnterLv1 = this.preventDefault; // 1级目录可拖入.因为目录默认不可拖入. 所以可拖入要preventDefault
          this.catalogDragEnterLv2 = this.enableDefault;
          this.catalogDragEnterLv3 = this.enableDefault;
          // 设置各级目录的dragover回调
          this.catalogDragOverLv1 = this.catalogDragOver; // 1级目录可拖行, 并会持续处理拖入事件
          this.catalogDragOverLv2 = this.enableDefault;
          this.catalogDragOverLv3 = this.enableDefault;
          // 设置各级目录的drop回调
          this.catalogDropLv1 = this.catalogDrop; // 1级目录可降落, 并会处理一次降落事件
          this.catalogDropLv2 = this.enableDefault;
          this.catalogDropLv3 = this.enableDefault;
          break;
        case 2:
          // 设置各级目录的dragenter回调
          this.catalogDragEnterLv1 = this.preventDefault; // 1级目录可拖入
          this.catalogDragEnterLv2 = this.preventDefault; // 2级目录可拖入
          this.catalogDragEnterLv3 = this.enableDefault;
          // 设置各级目录的dragover回调
          this.catalogDragOverLv1 = this.catalogDragOver; // 1级目录可拖行, 并会持续处理拖入事件
          this.catalogDragOverLv2 = this.catalogDragOver; // 2级目录可拖行, 并会持续处理拖入事件
          this.catalogDragOverLv3 = this.enableDefault;
          // 设置各级目录的drop回调
          this.catalogDropLv1 = this.catalogDrop; // 1级目录可降落, 并会处理一次降落事件
          this.catalogDropLv2 = this.catalogDrop; // 2级目录可降落, 并会处理一次降落事件
          this.catalogDropLv3 = this.enableDefault;
          break;
        case 3:
          // 设置各级目录的dragenter回调
          this.catalogDragEnterLv1 = this.enableDefault;
          this.catalogDragEnterLv2 = this.preventDefault; // 2级目录可拖入
          this.catalogDragEnterLv3 = this.preventDefault; // 3级目录可拖入
          // 设置各级目录的dragover回调
          this.catalogDragOverLv1 = this.enableDefault;
          this.catalogDragOverLv2 = this.catalogDragOver; // 2级目录可拖行, 并会持续处理拖入事件
          this.catalogDragOverLv3 = this.catalogDragOver; // 3级目录可拖行, 并会持续处理拖入事件
          // 设置各级目录的drop回调
          this.catalogDropLv1 = this.enableDefault;
          this.catalogDropLv2 = this.catalogDrop; // 2级目录可降落, 并会处理一次降落事件
          this.catalogDropLv3 = this.catalogDrop; // 3级目录可降落, 并会处理一次降落事件
          break;
        default:
          break;
      }

      // 计算目录高度的一半, 上传到this. 用于判断是降落在上半边还是下半边
      if (!this.catalogHalfHeight) {
        this.catalogHalfHeight = Math.floor(parseInt(window.getComputedStyle(e.currentTarget).height, 10) / 2);
      }
    },

    // 拖动: 拖动: 拖动结束时, 在被拖动的那个元素上触发一次. 所有目录都绑定该事件
    catalogDragEnd() {
      // 清理回调
      // 设置各级目录的dragenter回调
      this.catalogDragEnterLv1 = null;
      this.catalogDragEnterLv2 = null;
      this.catalogDragEnterLv3 = null;
      // 设置各级目录的dragover回调
      this.catalogDragOverLv1 = null;
      this.catalogDragOverLv2 = null;
      this.catalogDragOverLv3 = null;
      // 设置各级目录的drop回调
      this.catalogDropLv1 = null;
      this.catalogDropLv2 = null;
      this.catalogDropLv3 = null;

      // 清理数据: 因为drop事件不一定会触发, 而DragEnd一定会触发, 所以在这里触发数据
      setTimeout(() => {
        this.draggedCatLv = null; // 源目录: 被拖动的目录的信息记录
        this.draggedCatName = null;
        this.draggedCatIndex = null;
        this.droppedCatLv = null; // 目标目录: 接收到降落的目标目录的信息记录
        this.droppedCatName = null;
        this.droppedCatIndex = null;
        this.dropHalf = null;
      }, 0);
    },

    // 拖动: 元素拖入时, 在接收元素 "持续" 触发. 其中的逻辑要尽可能的少
    catalogDragOver(e, catLv, catName, catIndex) {
      // 允许拖入
      e.preventDefault();
      // 记录信息
      this.droppedCatLv = catLv;
      this.droppedCatName = catName;
      this.droppedCatIndex = catIndex;
      if (catLv === this.draggedCatLv) {
        if (e.offsetY <= this.catalogHalfHeight) {
          this.dropHalf = 'TOP';
        } else {
          this.dropHalf = 'BOTTOM';
        }
      } else {
        this.dropHalf = null;
      }
    },

    // 拖动: 元素拖离时, 在结束元素上触发一次. 所有目录都绑定该事件
    catalogDragLeave() {
      // 清理
      this.droppedCatLv = null; // 目标目录: 接收到降落的目标目录的信息记录
      this.droppedCatName = null;
      this.droppedCatIndex = null;
      this.dropHalf = null;
    },

    // 拖动: 元素降落时, 在接收元素触发一次, 会重排序目录
    async catalogDrop(e, catLv, catName, catIndex) {
      // 记录信息, 因为dragend时, 信息会被清除掉
      const {
        draggedCatLv,
        draggedCatName,
        draggedCatIndex,
        dropHalf,
      } = this;
      const droppedCatLv = catLv;
      const droppedCatName = catName;
      const droppedCatIndex = catIndex;


      // 组织要发送给后端的信息
      let isOrganizeDataSuccess = true;
      const data = {
        task: 'REORDER',
        catName: draggedCatName,
        affectedCatalogs: [],
      };
      if (draggedCatLv === droppedCatLv) { // 同级排序
        if (
          droppedCatName === draggedCatName // 这些情况顺序是不变的
          || (dropHalf === 'TOP' && droppedCatIndex - draggedCatIndex === 1)
          || (dropHalf === 'BOTTOM' && draggedCatIndex - droppedCatIndex === 1)
        ) {
          isOrganizeDataSuccess = false;
        } else {
          // 获取要重命名目录的祖先名
          const ancestorCatNames = [];
          switch (draggedCatLv) {
            case 2:
              ancestorCatNames.push(this.curCatLv1);
              break;
            case 3:
              ancestorCatNames.push(this.curCatLv1);
              ancestorCatNames.push(this.curCatLv2);
              break;
            default:
              break;
          }
          const oldCatOrder = this[`catsLv${draggedCatLv}`].slice();
          const insertIndex = dropHalf === 'TOP' ? droppedCatIndex : droppedCatIndex + 1;
          let newCatOrder = [].concat(
            oldCatOrder.slice(0, insertIndex),
            draggedCatName,
            oldCatOrder.slice(insertIndex),
          );
          const deleteIndex = draggedCatIndex < insertIndex ? draggedCatIndex : draggedCatIndex + 1;
          newCatOrder = newCatOrder.filter((cat, index) => index !== deleteIndex);
          data.affectedCatalogs.push({
            ancestorCatNames,
            newCatOrder,
          });
        }
      } else { // 子集排序
        // eslint-disable-next-line no-lonely-if
        if ( // 这些情况下目录顺序是不变的
          (droppedCatLv === 1 && droppedCatName === this.curCatLv1)
          || (droppedCatLv === 2 && droppedCatName === this.curCatLv2)
        ) {
          isOrganizeDataSuccess = false;
        } else {
          // 记录拖入目录的变化
          const ancestorCatNames1 = [];
          let newCatOrder1;
          switch (droppedCatLv) {
            case 1:
              ancestorCatNames1.push(droppedCatName);
              newCatOrder1 = Object.keys(this.catalog[droppedCatName]);
              newCatOrder1.push(draggedCatName);
              break;
            case 2:
              ancestorCatNames1.push(this.curCatLv1);
              ancestorCatNames1.push(droppedCatName);
              newCatOrder1 = Object.keys(this.catalog[this.curCatLv1][droppedCatName]);
              newCatOrder1.push(draggedCatName);
              break;
            default:
              break;
          }

          if (new Set(newCatOrder1).size !== newCatOrder1.length) {
            isOrganizeDataSuccess = false;
            this.$message({
              type: 'warning',
              message: `目录名已存在: ${draggedCatName}`,
            });
          } else {
            data.affectedCatalogs.push({
              ancestorCatNames: ancestorCatNames1,
              newCatOrder: newCatOrder1,
            });
            // 记录拖出目录的变化
            const ancestorCatNames2 = [];
            switch (draggedCatLv) {
              case 2:
                ancestorCatNames2.push(this.curCatLv1);
                break;
              case 3:
                ancestorCatNames2.push(this.curCatLv1);
                ancestorCatNames2.push(this.curCatLv2);
                break;
              default:
                break;
            }
            const newCatOrder2 = this[`catsLv${draggedCatLv}`].slice().filter(cat => cat !== draggedCatName);
            data.affectedCatalogs.push({
              ancestorCatNames: ancestorCatNames2,
              newCatOrder: newCatOrder2,
            });

            data.affectedCatalogs.reverse(); // 按接口要求, 需要把要移出文件的目录放前面, 要移入文件的目录放后面
          }
        }
      }

      // 先保存文件
      if (this.curCatLv3) { // 如果已经打开了文件, 则先保存
        await this.$store.state.editor.runCommand('SAVE', { triggerType: 'CATALOG' });
      }

      // 真正向后台发送信息
      if (isOrganizeDataSuccess) {
        // 给后端发送信息
        await Directories.reorder(data);

        // 记录一会儿刷新后要打开的目录
        switch (draggedCatLv) {
          case 1:
            this.waitOpenCatLv1 = this.curCatLv1;
            this.waitOpenCatLv2 = '';
            this.waitOpenCatLv3 = '';
            break;
          case 2:
            if (draggedCatLv === droppedCatLv) {
              this.waitOpenCatLv1 = this.curCatLv1;
              this.waitOpenCatLv2 = draggedCatName;
              this.waitOpenCatLv3 = '';
            } else {
              this.waitOpenCatLv1 = droppedCatName;
              this.waitOpenCatLv2 = draggedCatName;
              this.waitOpenCatLv3 = '';
            }
            break;
          case 3:
            if (draggedCatLv === droppedCatLv) {
              this.waitOpenCatLv1 = this.curCatLv1;
              this.waitOpenCatLv2 = this.curCatLv2;
              this.waitOpenCatLv3 = draggedCatName;
            } else {
              this.waitOpenCatLv1 = this.curCatLv1;
              this.waitOpenCatLv2 = droppedCatName;
              this.waitOpenCatLv3 = draggedCatName;
            }
            break;
          default:
            break;
        }

        // 重新从后端获取目录, 触发前端更新
        await this.getCatalog();
      }
    },

    // 拖动: 阻止默认事件
    preventDefault(e) {
      e.preventDefault();
    },

    // 拖动: 启用默认事件
    enableDefault() {},

    // 其他: 绑定热键
    bindHotKey() {
      document.addEventListener('keydown', (e) => {
        // ctrl + /: 显隐目录跳转
        if (e.ctrlKey && e.keyCode === 191) {
          this.isShowCatalogJump = !this.isShowCatalogJump;
          if (this.isShowCatalogJump) {
            this.curSelectedSearchResBias = 0;
            setTimeout(() => {
              this.$refs['catalog-jump-input'].focus();
            }, 300);
          }
        }

        // 上下切换目录搜索结果
        if (this.isShowCatalogJump
          && e.keyCode === 40
          && this.curSelectedSearchResBias < this.catalogJumpSearchRes.length - 1
        ) {
          this.curSelectedSearchResBias += 1;
        }
        if (this.isShowCatalogJump
          && e.keyCode === 38
          && this.curSelectedSearchResBias > 0
        ) {
          this.curSelectedSearchResBias -= 1;
        }

        // enter键跳转至当前选中的目录
        if (this.isShowCatalogJump && e.keyCode === 13) {
          this.jumpCatalog(this.catalogJumpSearchRes[0 + this.curSelectedSearchResBias]);
        }
      });
    },
  },

  // 生命周期: dom加载完毕后
  async mounted() {
    this.bindHotKey(); // 会绑定一些属于此组件的热键
    this.closeCatalogContextMenuOnClick(); // 设置在别的地方点击时会关闭右键菜单
    this.$watch('$store.state.editor', async (editor) => { // 等待editor加载完成
      if (editor) {
        await this.getCatalog(); // 获取目录结构
      }
    }, { immediate: true });
  },
};
</script>

<style lang="scss" scoped>
@import "@/themes/craft/var.scss";
/* scrollbar & selection*/
.catalog-container::-webkit-scrollbar {
  width: 0px!important;
}
span::selection {
  background: $selection!important;
}

// 容器
#catalog {
  display: flex;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  height: 100%;
  font-size: $font-size-catalog;
  color: $catalog-color;
}

// 目录
.catalog-container {
  flex-shrink: 0;
  flex-grow: 0;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
  border-right: $catalog-col-border;
  margin: 0;
  padding: 0;
  padding-bottom: 40px;
  list-style: none;
  li {
    height: 27px;
    line-height: $font-size-main;
    padding: 6px 0px 6px 4px;
    white-space: nowrap;
    text-overflow: ellipsis;
    box-sizing: border-box;
    overflow: hidden;
    border: 0.5px solid transparent; // 给拖动预留的border
    cursor: default;
  }
  li:hover {
    background: $catalog-hover;
  }
  li.cat-active {
    background: $catalog-active-bg;
    color: $catalog-active-color;
  }
  li.cat-dragover-active {
    border: 0.5px solid $catalog-active-border-color;
  }
  li.cat-dragover-top-active {
    border-top: 0.5px solid $catalog-active-border-color;
  }
  li.cat-dragover-bottom-active {
    border-bottom: 0.5px solid $catalog-active-border-color;
  }
  .catalog-icon {
    position: relative;
    height: 100%;
    vertical-align: middle;
    margin-right: 4px;
  }
}
#catalog-level-1 {
  flex-basis: 30%;
}
#catalog-level-2 {
  flex-basis: 30%;
}
#catalog-level-3 {
  flex-basis: 40%;
}

// 目录模态框
#catalog-modal {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: $catalog-modal-bg;
  cursor: wait;
}

// 目录跳转
#catalog-jump {
  position: absolute;
  left: 0px;
  top: 0px;
  width: 100%;
  height: 100%;
  background: $catalog-jump-bg;
  .catalog-jump-input {
    width: 100%;
    height: 30px;
    background: $catalog-jump-input-bg;
    border: none;
    box-sizing: border-box;
    text-align: center;
    font-weight: bold;
    color: $catalog-jump-input-color;
    outline: none;
  }
  .catalog-jump-result {
    list-style: none;
    padding: 0;
    margin: 0;
    li {
      padding: 5px 8px;
      box-sizing: border-box;
      border-bottom: $catalog-jump-li-border;
      &:hover {
       background: $catalog-active-bg;
       color: $catalog-active-color;
       cursor: default;
      }
    }
  }
  .selected-search-res {
    background: $catalog-active-bg;
    color: $catalog-active-color;
  }
}
</style>

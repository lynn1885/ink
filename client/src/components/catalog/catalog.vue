/* eslint-disable import/no-unresolved */
/**
 * 1. 目录结构硬编码为3层, 且和后端接口耦合, 不能修改
 * 2. 为了保证数据流动的简洁性
 * 所有对后端的写操作, 包括: 创建目录, 重命名, 目录排序. 都先修改后端, 然后重新获取后端数据, 前端再应用更新
 */

<template>
  <div id="catalog" v-if="isCatalogLoaded">
    <!-- 一级目录 -->
    <ul
      class="catalog-container"
      id="catalog-level-1"
      @contextmenu="showCatalogContextMenu($event, 1)"
    >
      <li
        v-for="(cat, index) of catsLv1"
        v-show="cat[0]!=='.' || curCatLv1 === cat"
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
        <note-icon class="note-icon" :icon-name="cat" v-if="isShowCatIcon"></note-icon>
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
        <note-icon class="note-icon" :icon-name="cat" v-if="isShowCatIcon"></note-icon>
        {{cat}}
      </li>
    </ul>

    <!-- 三级目录 -->
    <ul
      class="catalog-container"
      id="catalog-level-3"
      draggable="true"
      @contextmenu="showCatalogContextMenu($event, 3)"
      @dragenter="preventDefault"
      @dragover="preventDefault"
      @drop="containerDropLv3($event)"

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
        <note-icon class="note-icon" :icon-name="cat" v-if="isShowCatIcon"></note-icon>
        {{cat}}
      </li>
    </ul>

    <!-- 上下文菜单-->
    <content-menu
      v-show="isShowContentMenu"
      :style="{'left': contentMenuLeft, 'top': contentMenuTop}"
    >
      <template slot="menu-list">
        <li
          v-for="menu of curContentMenu"
          :style="menu ==='delete' ?'color: rgb(251, 117, 117)':'' "
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
import _ from 'lodash';
import Directories from '@/models/directories';
import Files from '@/models/files';
import ContentMenu from '@/components/content-menu/content-menu.vue';
import NoteIcon from '@/components/note-icon/note-icon.vue';
import tools from '@/tools/tools';


export default {
  name: 'catalog',
  components: {
    ContentMenu,
    NoteIcon,
  },
  data() {
    return {
      editor: null,
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
      contentMenuCat: ['create before', 'create after', 'rename', 'delete', 'export zip', 'export docx'], // 目录的右键菜单
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
      catalogDragEnterLv1: () => {}, // 目录的DragEnter回调
      catalogDragEnterLv2: () => {},
      catalogDragEnterLv3: () => {},
      catalogDragOverLv1: () => {}, // 目录的DragOver回调
      catalogDragOverLv2: () => {},
      catalogDragOverLv3: () => {},
      catalogDropLv1: () => {}, // 目录的Drop回调
      catalogDropLv2: () => {},
      catalogDropLv3: () => {},
      // 图标
      isShowCatIcon: true, // 是否显示目录图标
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
      if (value && typeof this.catalog[value] === 'object') {
      // 只有选中一级菜单时, 才标记二级菜单容器可用. 比如, 二级菜单未选中时, 不能在二级菜单右键
        this.isConAvailableLv2 = true;
        this.$store.commit('updateCurCatalogArr', [this.curCatLv1, null, null]);
        this.updateCatalog(2);
      } else {
        this.isConAvailableLv2 = false;
      }
    },

    // 监听: 选中的二级路径变更, 更新三级目录
    curCatLv2(value) {
      if (value && typeof this.catalog[this.curCatLv1][value] === 'object') {
        // 只有选中二级菜单时, 才标记三级菜单容器可用. 比如, 二级菜单未选中时, 不能在三级菜单右键
        this.isConAvailableLv3 = true;
        this.$store.commit('updateCurCatalogArr', [this.curCatLv1, this.curCatLv2, null]);
        this.updateCatalog(3);
      } else {
        this.isConAvailableLv3 = false;
      }
    },

    // 监听: 选中的三级路径变更时, 更新笔记. 此时才会触发真正的文件加载
    // 需要三级**目录**也对应一个对象才行 ⚠️
    async curCatLv3(value) {
      if (value && typeof this.catalog[this.curCatLv1][this.curCatLv2][value] === 'object') {
        this.$store.commit('updateCurCatalogArr', [this.curCatLv1, this.curCatLv2, this.curCatLv3]);
        const curOpenFilePath = this.$store.state.editor.fileServer.curFilePath;
        const nextOpenFilePath = `${this.curCatLv1}/${this.curCatLv2}/${this.curCatLv3}/${this.curCatLv3}.md`;
        if (curOpenFilePath !== nextOpenFilePath) {
          await this.$store.state.editor.runCommand(
            'OPENFILE',
            nextOpenFilePath,
          );
        } else {
          this.$store.commit('updateCurFilePath', curOpenFilePath);
          console.log('当前打开的路径就是目标路径, 不能/无需重复打开', curOpenFilePath);
        }
      }
    },

    // 监听: 监听gotoThisCatalog字段, 此字段变更时触发目录跳转
    // 这个字段常由外部调用. 触发目录变更的两个入口, 一个是getCatalog()之后, 一个是这里
    '$store.state.gotoThisCatalog': function foo(value) {
      if (!Array.isArray(value)) {
        console.error('要前往的路径不是数组: ', value);
        return;
      }
      if (
        !this.catalog[value[0]] ||
        !this.catalog[value[0]][value[1]] ||
        !this.catalog[value[0]][value[1]][value[2]]
      ) {
        this.$message.error(`要前往的路径不存在: ${value}`);
        return;
      }
      if (this.$store.state.isProhibitOperation) {
        this.$message.error('暂时不能操作目录'); // 重要
        return;
      }
      this.$store.commit('updateIsProhibitOperation', true);
      if (Array.isArray(value)) {
        // 因为设置各级目录时都会触发对应的监听事件, 所以把设置1, 2, 3级目录放在不同的事件循环中, 给监听事件留出时间
        [this.curCatLv1] = value;
        setTimeout(() => {
          [, this.curCatLv2] = value;
          setTimeout(() => {
            [, , this.curCatLv3] = value;
            this.$store.commit('updateIsProhibitOperation', false);
          }, 0);
        }, 0);
      }
    },
  },

  methods: {
    // 目录: 获取目录
    async getCatalog() {
      // 从后端获取目录
      this.catalog = await Directories.get(this.$message);
      // 上传到vuex (克隆, 防止误修改)
      this.$store.commit('updateCatalog', _.cloneDeep(this.catalog));
      // 标记目录加载完毕
      this.isCatalogLoaded = true;

      // 设置默认打开的1, 2, 3级目录
      // 因为设置this.catalog 和 设置各级目录时都会触发对应的监听事件, 所以把它们放在不同的事件循环中
      // 确保当前上一等级的监听事件发生后, 再设置下一级的目录
      // 如果存在waitOpenCatLv1, 则默认打开waitOpenCat系列的目录, 否则默认打开各级的第一个目录
      // 注意是只有存在waitOpenCatLv**1**, 就打开waitOpenCat系列
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
        this.catsLv2 = [];
        this.catsLv3 = [];
      } else if (lv === 2) { // 一级目录变更, 需要更新当前二级目录列表
        this.curCatLv2 = ''; // 一级目录变更, 则需要把当前选中的二三级目录清空
        this.curCatLv3 = '';
        this.catsLv2 = this.curCatLv1 && typeof this.catalog[this.curCatLv1] === 'object' // 然后重新赋值
          ? Object.keys(this.catalog[this.curCatLv1])
          : [];
        this.catsLv3 = [];
      } else if (lv === 3) { // 二级目录变更, 需要更新当前三级目录列表
        this.curCatLv3 = null; // 三级目录变更, 则需要把当前选中的三级目录清空
        this.catsLv3 = this.curCatLv2 && // 然后重新赋值
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

    // 右键菜单: 处理右键菜单(入口函数, 重要)
    async handleContentMenu(menu) {
      // 获取editor, 因为处理右键菜单前, 我们往往需要调用editor的save方法, 保存当前编辑中的文档
      if (!this.$store.state.editor) {
        this.$message({
          type: 'warning',
          message: '编辑器还在加载中, 暂时不能使用右键菜单哦',
        });
        return;
      }

      // 在处理右键任务时, 锁定菜单栏, 禁止操作
      this.$store.commit('updateIsProhibitOperation', true);

      // 处理右键任务
      if (menu === 'create' || menu === 'create before' || menu === 'create after') {
        await this.createCat(menu);
      } else if (menu === 'delete') {
        await this.deleteCat();
      } else if (menu === 'rename') {
        await this.rename();
      } else if (menu === 'export zip') {
        if (this.curContentMenuCatLv === 3) {
          this.$message({
            type: 'success',
            message: '后台压缩中, 即将导出...',
          });
          await this.exportNote('zip');
        } else {
          this.$message({
            type: 'warning',
            message: '目前只有三级目录支持导出',
          });
        }
      } else if (menu === 'export docx') {
        if (this.curContentMenuCatLv === 3) {
          this.$message({
            type: 'success',
            message: '后台生成中, 即将导出...',
          });
          await this.exportNote('docx');
        } else {
          this.$message({
            type: 'warning',
            message: '目前只有三级目录支持导出',
          });
        }
      }

      // 关闭菜单栏锁定
      this.$store.commit('updateIsProhibitOperation', false);
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
          const verifyInfo = tools.isFileNameValid(value);
          if (!value) {
            return '目录名不能为空';
          } else if (verifyInfo !== true) {
            return verifyInfo;
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

      // 标记现在打开的文件是空
      this.$store.commit('updateCurFilePath', null);

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
          const verifyInfo = tools.isFileNameValid(value);
          if (!value) {
            return '目录名不能为空';
          } else if (value === curContentMenuCatName) {
            return '新目录名和旧目录名一样';
          } else if (verifyInfo !== true) {
            return verifyInfo;
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

    // 右键菜单: 导出笔记
    async exportNote(type = 'zip') {
      const fileName = this.curContentMenuCatName;
      try {
        if (type === 'zip') {
          const zipBuffer = await Files.exportNote([this.curCatLv1, this.curCatLv2, this.curContentMenuCatName], 'zip', this.$message);
          tools.downloadArrayBuffer(zipBuffer, fileName, type);
        } else if (type === 'docx') {
          const docxBuffer = await Files.exportNote([this.curCatLv1, this.curCatLv2, this.curContentMenuCatName], 'docx', this.$message);
          tools.downloadArrayBuffer(docxBuffer, fileName, type);
        }
      } catch (error) {
        console.error('导出笔记失败: ', error);
      }
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

    // 拖动: zip文件降落在三级容器中 ⭐ 导入zip笔记
    async containerDropLv3(e) {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        const zipFile = e.dataTransfer.files[0];
        if (!zipFile.name.endsWith('.zip')) {
          this.$message({
            type: 'warning',
            message: '只支持导入.zip格式的文件'
          });
          return;
        }
        const zipFileName = zipFile.name.replace('.zip', '');

        if (this.catsLv3.includes(zipFileName)) {
          this.$message({
            type: 'warning',
            message: `无法导入, 笔记名已存在: ${zipFileName}`
          });
          return;
        }

        // 导入
        const formData = new FormData();
        formData.append('file', zipFile);
        formData.append('notePath', [this.curCatLv1, this.curCatLv2, zipFileName].join('/'));
        const catOrderAfterImport = this.catsLv3.slice();
        catOrderAfterImport.push(zipFileName);
        formData.append('catOrderAfterImport', catOrderAfterImport);
        try {
          this.$message.success(`导入笔记中, 请耐心等待: ${zipFileName}`);
          await Files.importNote(formData, this.$message);
          this.$message.success(`导入笔记成功: ${zipFileName}`);

          this.waitOpenCatLv1 = this.curCatLv1;
          this.waitOpenCatLv2 = this.curCatLv2;
          this.waitOpenCatLv3 = zipFileName;
          console.log(123, this.waitOpenCatLv1, this.waitOpenCatLv2, this.waitOpenCatLv3);
          // 重新从后端获取目录, 触发前端更新
          await this.getCatalog();
        } catch (error) {
          this.$message.warning(`导入笔记失败: ${error}`);
        }
      }
    },

    // async getAllNotesHeaders() {
    //   const files = [];
    //   for (const lv1 in this.catalog) {
    //     if (lv1) {
    //       for (const lv2 in this.catalog[lv1]) {
    //         if (lv2) {
    //           for (const lv3 in this.catalog[lv1][lv2]) {
    //             const fileText = await Files.get(`${lv1}/${lv2}/${lv3}/${lv3}.md`);
    //             if (fileText) {
    //               const fileArr = fileText.split('\n').filter(line => line.startsWith('#'));
    //               files.push(fileArr);
    //             }
    //           }
    //         }
    //       }
    //     }
    //   }
    // },

    // 拖动: 阻止默认事件
    preventDefault(e) {
      e.preventDefault();
    },

    // 拖动: 启用默认事件
    enableDefault() {},

    // get note count
    _getNoteCount(catalog = this.catalog) {
      let count = 0;
      // eslint-disable-next-line no-restricted-syntax
      for (const lv1 in catalog) {
        if (catalog[lv1]) {
          // eslint-disable-next-line no-restricted-syntax
          for (const lv2 in catalog[lv1]) {
            if (catalog[lv1][lv2]) {
              count += Object.keys(catalog[lv1][lv2]).length;
            }
          }
        }
      }
      return count;
    },
  },

  // 生命周期: dom加载完毕后
  async mounted() {
    this.closeCatalogContextMenuOnClick(); // 设置在别的地方点击时会关闭右键菜单
    const unwatch = this.$watch('$store.state.editor', async (editor) => { // 等待editor加载完成
      if (editor) {
        unwatch();
        this.$store.state.editor.catalogPlugin = { // mount method
          getNoteCount: this._getNoteCount,
        };
        this.editor = editor;
        await this.getCatalog(); // 获取目录结构

        // 缓存所有笔记
        // await this.getAllNotesHeaders();
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

// 容器
#catalog {
  display: flex;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  height: 100%;
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
  padding-bottom: 200px;
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
    cursor: pointer;
  }
  li[title^=--] {
    color: #bbb;
    text-align: center;
    font-size: 10px;
    font-weight: bold;
    img {
      display: none;
    }
  }
  li:hover {
    background: $sidebar-item-hover-bg;
  }
  li.cat-active {
    background: $sidebar-item-active-bg;
  }
  li.cat-dragover-active {
    border: 0.5px solid $sidebar-item-active-border-color;
  }
  li.cat-dragover-top-active {
    border-top: 0.5px solid $sidebar-item-active-border-color;
  }
  li.cat-dragover-bottom-active {
    border-bottom: 0.5px solid $sidebar-item-active-border-color;
  }
  .note-icon {
    position: relative;
    height: 100%;
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
</style>

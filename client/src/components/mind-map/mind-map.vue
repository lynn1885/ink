<template>
  <div id="mind-map" @click="onClickMindMap">
  </div>
</template>
<script>
import $ from 'jquery';
import 'jsmind/style/jsmind.css';
import JsMind from 'jsmind';
import classNames from '@/tools/class-names';

// const isEnableConsole = false;

export default {
  name: 'mind-map',
  data() {
    return {
      editor: null,
      mindMapArr: [], // 脑图中的数据
      jm: null, // 脑图实例
      contentUpdateTimer: null, // 内容变更时的计时器, 用于实现节流
      isShowMindMap: true,
      isProhibitLineJump: false, // 是否禁用行跳转
    };
  },

  watch: {
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        if (value) {
          this.editor = value;
          this.editor.on('changes', this.onChanges);
          setTimeout(() => {
            this.build(this.editor);
          }, 0);
        }
      },
    },

    '$store.state.editor.curCursorLineNum': {
      immediate: true,
      handler(lineNum) {
        if (!this.isProhibitLineJump) this.onCursorMove(lineNum);
      }
    }
  },

  methods: {
    // ⭐ 构造mind map
    build(editor) {
      // prepare data
      const data = this.buildMindMapData(editor.getHeadersHierarchy(), {
        id: 'root',
        isroot: true,
        topic: editor.fileServer.curFileDir,
        'background-color': '#aaa',
        'font-size': 17
      });
      this.mindMapArr = data;

      const isJmCreated = !!JsMind.current; // 是否已经创建实例
      // get/create a jsmind instance
      const jm = JsMind.current || new JsMind({
        container: 'mind-map',
        theme: 'clouds',
        editable: false,
        support_html: true,
        view: {
          engine: 'svg',
        },
        shortcut: {
          enable: false,
        },
      });
      this.jm = jm;

      const mind = {
        meta: {
          version: '0.2',
        },
        format: 'node_array',
        data,
      };
      jm.show(mind);

      // 首次创建时, 缩放到合适大小
      if (!isJmCreated) {
        jm.view.zoomOut();
        jm.view.zoomOut();
        jm.view.zoomOut();
      }

      return false;
    },

    //  移动光标时
    onCursorMove(lineNum, behavior = 'smooth') {
      if (!this.mindMapArr || !this.mindMapArr.length || !this.jm) return;
      // 节流
      // 找到当前光标所在的的脑图节点id
      let curCursorMindNodeId;
      for (const mindNode of this.mindMapArr) {
        const mindNodeLine = Number(mindNode.id.match(/^[0-9]+/));
        if (mindNodeLine <= lineNum) { if (mindNode.id) curCursorMindNodeId = mindNode.id; } else { break; }
      }
      // 选中mind map该节点
      this.jm.select_node(curCursorMindNodeId);
      // 将mind map该节点滚动到视野中
      const curCursorMindNodeDom = $(`jmnode[nodeid='${curCursorMindNodeId}']`);
      if (curCursorMindNodeDom && curCursorMindNodeDom[0]) {
        curCursorMindNodeDom[0].scrollIntoView({
          behavior,
          block: 'center',
          inline: 'center',
        });
      }
    },

    // 编辑时
    onChanges(e) {
      this.isProhibitLineJump = true; // 编辑时禁用跳转

      clearTimeout(this.contentUpdateTimer);
      this.contentUpdateTimer = setTimeout(() => {
        this.build(this.editor); // 重新构建mind map
        const curCursorLine = e.doc.getCursor().line;
        this.onCursorMove(curCursorLine, 'auto');
        this.isProhibitLineJump = false;
      }, 500);
    },

    // 点击mind map时
    onClickMindMap() {
      // 跳转到正文对应的行
      const clickMindNode = this.jm.get_selected_node();
      if (!clickMindNode || !clickMindNode.id) return;
      try {
        const gotoThisLine = clickMindNode.id.match(/^[0-9]+/)[0];
        this.editor.scrollNoteToThisLine(gotoThisLine, classNames.highlightLineClass, 'unfoldAll', true);
      } catch (error) {
        console.warn('无法跳转到指定行:', error);
      }
    },


    // build mind map data
    // 不显示以"图示"两个字结尾的章节
    buildMindMapData(hierarchy, root) {
      const data = [root];
      let i = 1;
      for (const node1 of hierarchy) {
        if (node1.text.endsWith('图示')) continue;
        data.push({
          id: node1.lineNum + node1.text, parentid: 'root', topic: i + node1.text.replace(/#+/, ''), 'background-color': '#e2d4c5',
        });
        i += 1;
        for (const node2 of node1.children) {
          if (node2.text.endsWith('图示')) continue;
          data.push({
            id: node2.lineNum + node2.text, parentid: node1.lineNum + node1.text, topic: node2.text.replace(/#+/, ''), 'background-color': '#cde2d7',
          });
          for (const node3 of node2.children) {
            if (node3.text.endsWith('图示')) continue;
            data.push({
              id: node3.lineNum + node3.text, parentid: node2.lineNum + node2.text, topic: node3.text.replace(/#+/, ''), 'background-color': '#e2d4c5', expanded: true,
            });
            for (const node4 of node3.children) {
              if (node4.text.endsWith('图示')) continue;
              data.push({
                id: node4.lineNum + node4.text, parentid: node3.lineNum + node3.text, topic: node4.text.replace(/#+/, ''), 'background-color': 'rgb(182, 216, 174)', expanded: true,
              });
              for (const node5 of node4.children) {
                if (node5.text.endsWith('图示')) continue;
                data.push({
                  id: node5.lineNum + node5.text, parentid: node4.lineNum + node4.text, topic: node5.text.replace(/#+/, ''), 'background-color': 'rgb(224, 195, 195)', expanded: true
                });
                for (const node6 of node5.children) {
                  if (node6.text.endsWith('图示')) continue;
                  data.push({
                    id: node6.lineNum + node6.text, parentid: node5.lineNum + node5.text, topic: node6.text.replace(/#+/, ''), 'background-color': '#ccc', expanded: true
                  });
                }
              }
            }
          }
        }
      }
      return data;
    }
  },

  created() {
  },

  destroyed() {
    this.editor.off('changes', this.onChanges);
    JsMind.current = undefined; // 标记下次打开时重新构建
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#mind-map {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: auto;
}
</style>
<style>
jmnode {
  cursor: pointer;
  max-width: 3000px;
}
</style>

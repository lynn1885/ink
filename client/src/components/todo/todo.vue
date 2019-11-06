<template>
  <div id="todo">
    <!-- todo info -->
    <div id="todo-info">
      <div class="normal" v-if="todos.length < maxTodoNum">共有 {{todos.length}} 条待办事项~</div>
      <div class="warning" v-else>待办事项太多了, 只显示前 {{maxTodoNum}} 条</div>
    </div>

    <!-- todo results -->
    <div id="todo-results">
      <!-- ⚠️ the key is `todo.lineNum + todo.text`, but even if the key does not change, the update will be triggered.-->
      <div
        :class="{ item: true, active: activeTodoItem === todo }"
        :key="todo.lineNum + todo.text"
        v-for="todo of todos"
        @click="clickTodoItemHandler(todo)"
      >
        <!-- <div class="line-number">line: {{todo.lineNum}}</div> -->
        <div
          class="header"
          :key="header.headerLineNum + header.headerLineText"
          v-for="header of todo.headers"
        >{{header.headerLineText.replace(/^#+/, '')}}</div>
        <div class="text">{{todo.text.replace(todoMark, '')}}</div>
      </div>
    </div>
  </div>
</template>
<script>
import classNames from '@/tools/class-names.js';

const isEnableConsole = false;

export default {
  name: 'todo',
  data() {
    return {
      editor: null,
      todos: [],
      todoMark: 'Todo: ',
      maxTodoNum: 40,
      highlightLineClass: classNames.highlightLineClass,
      todoStrLength: 140,
      updateTimer: null,
      activeTodoItem: null,
      isUpdatedAfterSwitch: false,
      // Every change in the contents of the notes triggers an update
      // if the updateDely is too small, it will consume a lot of computing resources
      updateDelay: 600,
    };
  },

  watch: {
    // firstly, get editor
    // eslint-disable-next-line func-names
    '$store.state.editor': {
      immediate: true,
      handler(value) {
        // get editor
        if (value) {
          if (isEnableConsole) {
            console.log('watch: editor', value);
          }
          this.editor = value;
          setTimeout(() => {
            if (!this.isUpdatedAfterSwitch) {
              // After switching to the current plugin, trigger an update
              // set aside a little time to execute the animation
              this.updateTodos();
              this.isUpdatedAfterSwitch = true;
            }
            // only update when todos are changed
            // Todo: not compatible with mutiple cursors ⚠️
            this.editor.on('changes', this.changesHandler);
          }, 0);
        }
      },
    },
  },

  methods: {
    // update todos
    updateTodos() {
      const todos = [];
      const doc = this.editor.cm.getDoc();
      const lineCount = doc.lineCount();
      for (let i = 0; i < lineCount; i += 1) {
        if (todos.length >= this.maxTodoNum) break;
        const lineText = doc.getLine(i);
        if (this.isThisATodo(lineText)) {
          todos.push({
            lineNum: i,
            text: `${lineText.slice(0, this.todoStrLength)}${lineText.length > this.todoStrLength ? '...' : ''}`,
            headers: this.editor
              .getHeaderAncestors({ line: i, ch: 0 })
              .reverse(),
          });
        }
      }
      this.todos = todos;
      if (isEnableConsole) {
        console.log('updated todos: ', this.todos);
      }
    },

    // changes listener
    changesHandler() {
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        const startTime = new Date();
        if (isEnableConsole) {
          console.log('changes event emmited: need to update todos');
        }
        this.updateTodos();
        const updateConsumption = new Date() - startTime;
        if (updateConsumption > 50) {
          console.warn(
            'It took too long to update todos(without delay, ms): ',
            updateConsumption
          );
        }
        if (isEnableConsole) {
          console.log(
            'cumulative update consumption(without delay, ms): ',
            updateConsumption
          );
        }
        console.log('todo: changes: ', updateConsumption);
      }, this.updateDelay);
    },

    clickTodoItemHandler(item) {
      this.activeTodoItem = item;
      setTimeout(() => {
        this.editor.scrollNoteToThisLine(
          item.lineNum,
          this.highlightLineClass,
          'intelligently',
          true
        );
      }, 0);
    },

    // tool function
    // judge whether this is a todo
    isThisATodo(text) {
      return text.indexOf(this.todoMark) === 0;
    },
  },

  created() {
    if (isEnableConsole) {
      console.log('created');
    }
  },

  destroyed() {
    this.editor.off('changes', this.changesHandler);
    if (isEnableConsole) {
      console.log('destroyed');
    }
  },
};
</script>

<style lang="scss" scoped>
@import '@/themes/craft/var.scss';
#todo {
  position: relative;
  width: 100%;
  height: 100%;
}

// todo info
#todo-info {
  width: 100%;
  text-align: center;
  font-size: $font-size-sidebar;
  height: 30px;
  line-height: 30px;
  background: $tool-page-bg;
  color: $comment-color;
  .warning {
    background: $warning-bg;
    color: $warning-color;
  }
}

#todo-results {
  position: absolute;
  width: 100%;
  left: 0;
  right: 0;
  top: 30px;
  bottom: 0;
  box-sizing: border-box;
  overflow-y: scroll;
  .item.active {
    background: $sidebar-item-active-bg !important;
  }
  .item {
    font-size: $font-size-sidebar;
    padding: 6px 8px;
    margin-bottom: 6px;
    background: lighten($color: $tool-page-bg, $amount: 1);
    line-height: $sidebar-line-height;
    box-sizing: border-box;
    box-shadow: 0px 0px 2px 0px darken($color: $tool-page-bg, $amount: 4);
    cursor: pointer;
    .header,
    .line-number {
      color: $comment-color;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .text {
      padding: 4px 0px;
      font-size: $font-size-sidebar + 0.5px;
    }
    &:hover {
      background: $sidebar-item-hover-bg;
    }
    &:last-of-type {
      margin-bottom: 120px;
    }
  }
}
</style>

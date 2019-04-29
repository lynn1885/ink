<template>
  <div id="editor" ref="editor" v-show="isFileLoaded"></div>
</template>

<script>
import Editor from '@/libs/editor/editor';
import fileServer from '@/libs/file-server/file-server';
import inkImage from '@/libs/editor/ink-image';
import inkMath from '@/libs/editor/ink-math';
import inkFold from '@/libs/editor/ink-fold';
import inkKeyMap from '@/libs/editor/ink-key-map';
import inkFlexibleCursor from '@/libs/editor/ink-flexible-cursor';
import inkFlexibleCursorLineChar from '@/libs/editor/ink-flexible-cursor-line-char';
import inkHeaderManager from '@/libs/editor/ink-header-manager';
import inkLineReplace from '@/libs/editor/ink-line-replace';
import '@/libs/editor/themes/craft.scss'
import config from '@/config'

export default {
  name: 'editor',
  data() {
    return {
      editor: null,
      isFileLoaded: false,
    };
  },

  watch: {
    // TODO:
    // You must call refresh() after setValue().
    // However, you must use setTimeout to postpone the refresh() to after
    // CodeMirror/Browser has updated the layout according to the new content
    // Codemirror editor is not loading content until clicked
    // but I still find that, if I call this.editor.cm.refresh() after timeout 0
    // then when I click the editor, I will get an error:
    // Uncaught DOMException:
    // Failed to execute 'setEnd' on 'Range': The offset 39 is larger than the node's length (0).
    // if I call this.editor.cm.refresh() when timeout 1000, no error. don't know why
    async '$store.state.filePath'(newFilePath, oldFilePath) {
      if (newFilePath) {
        this.$store.commit('updateIsEditorLoading', true);
        // console.info('newFile: ', newFilePath, '\noldFile:', oldFilePath);
        try {
          if (this.editor.fileServer.isFileContentChanged) {
            this.editor.fileServer.turnOffAutoSave();
            await this.editor.fileServer.saveFile('CLOSE', true);
          }
          await this.editor.fileServer.loadFile(newFilePath);
        } catch (e) {
          console.error(e);
        }
        this.$store.commit('updateIsEditorLoading', false);
        this.isFileLoaded = true;
      }
    },
  },

  async mounted() {
    this.editor = new Editor(this.$refs.editor);
    this.editor.use(inkKeyMap);
    this.editor.use(inkFold);
    this.editor.use(inkFlexibleCursor);
    this.editor.use(inkFlexibleCursorLineChar);
    this.editor.use(inkHeaderManager);
    this.editor.use(inkLineReplace);
    this.editor.use(inkImage, {
      isUseFileServer: true,
    });
    this.editor.use(inkMath);
    this.editor.use(fileServer, {
      messager: this.$message,
      autoSaveInterval: config.autoSaveInterval,
      serverUrl: config.serverUrl,
      staticResUrl: config.staticResUrl,
      autoFoldDelay: config.autoFoldDelay,
    });
    this.$store.commit('updateEditor', this.editor);
  },
};
</script>

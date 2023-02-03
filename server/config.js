const path = require('path');

module.exports = {
  // user dirs & files
  user: {
    dirs: {
      notes: path.join(__dirname, './user/notes/'), // user notes directory
      noteImages: path.join(__dirname, './user/images/'), // user note images directory
      noteIcons: path.join(__dirname, './user/icons/'), // user note icons directory
      notePlugins: path.join(__dirname, './plugins/'), // plugins directory
      noteDeleted: path.join(__dirname, './user/deleted/'), // user deleted notes directory
      config: path.join(__dirname, './user/config'), // user config directory
    },
    files: {
      configFile: path.join(__dirname, './user/config/user.json'), // user config file name
      defaultNoteIcon: path.join(__dirname, './user/icons/__default__.png'), // default note icon
    },
  },

  // dirs & files for internal use , don't modify them
  inner: {
    dirs: {
      config: __dirname,
      res: path.join(__dirname, 'res'),
      innerNotes: path.join(__dirname, './res/.ink'),
    },
    files: {
      defaultNote: path.join(__dirname, './res/default-note.md'),
      defaultConfigFile: path.join(__dirname, './res/default-user-config.json'),
      defaultNoteIcon: path.join(__dirname, './res/default-note-icon.png'),
    },
  },

  // other
  port: 12340, // server will listen on this port
  backupInterval: 300, // seconds
  maxBackupFilesNumber: 12, // 最大备份文件数
  fileSizeLimit: 500, // KB
  maxSearchNum: 300, // when searching globally, how many results can you find at most
  importNodeImgPrefix: '__import__', // 导入的笔记的图片文件夹前缀
};

const path = require('path');

module.exports = {
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
  port: 12340, // server will listen on this port
  backupInterval: 300, // seconds
  maxBackupFilesNumber: 6,
  fileSizeLimit: 200, // KB
  maxSearchNum: 200, // when searching globally, how many results can you find at most
};

module.exports = {
  notesDir: './user/notes/', // notes directory
  noteImagesDir: './user/images/', // images directory
  noteIconsDir: './user/icons/', // icons directory
  noteDeletedDir: './user/deleted/', // deleted notes directory
  port: 3001, // server will listen on this port
  backupInterval: 300, // seconds
  maxBackupFilesNumber: 6,
  fileSizeLimit: 200, // KB
  maxSearchNum: 200, // when searching globally, how many results can you find at most
};

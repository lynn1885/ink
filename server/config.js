module.exports = {
  notesDir: './notes/',
  noteImagesDir: './notes/_images/', // 图片文件夹, 需要手动创建这个文件
  noteDeletedDir: './notes/_deleted/', // 被删除的文件临时存放的文件夹, 需要手动创建这个文件
  ignoreNoteDir: ['./notes/_images/', './notes/_icons/', './notes/_deleted/'], // 忽略的笔记文件夹, 不会返回给前端
  port: 3001,
  backupInterval: 300, // seconds
  maxBackupFilesNumber: 6,
  fileSizeLimit: 2000, // KB
};

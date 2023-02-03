const fs = require('fs');
const path = require('path');

// 配置源目录
const notePath = '../user/notes';

// 笔记目录
const notePathArr = [];

// 读取所有笔记路径
getNotePath(notePath);

// 递归函数
function getNotePath(p) {
  const items = fs.readdirSync(p);
  for (const item of items) {
    const newP = path.join(p, item);
    const itemStat = fs.statSync(newP);
    if (itemStat.isDirectory()) { // 是目录
      getNotePath(newP);
    } else if (itemStat.isFile) { // 是文件
      if (!/^[\d]+\.md$/.test(item)) { // 非备份文件
        notePathArr.push(newP);
      }
    }
  }
}

console.log('文件数量：', notePathArr.length);

// 读取文件
const noteContents = [];
let id = 1;
for (const p of notePathArr) {
  const content = {
    id,
    title: p,
    content: fs.readFileSync(p, 'utf-8'),
  };
  noteContents.push(content);
  id += 1;
}

// 写入本地文件
fs.writeFileSync('./ink.json', JSON.stringify(noteContents, null, 2));

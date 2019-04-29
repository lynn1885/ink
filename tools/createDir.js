const fs = require('fs');
const dirs = ['threading', '_thread', 'random', 'BaseManager'];

for (let d of dirs) {
  fs.mkdirSync(d);
  fs.writeFileSync(`./${d}/${d}.md`, '# 基础/总结');
}
#Todos
1. 开启服务器时, 自动清理_deleted目录中的过期文件
2. 前端rename, reorder, create等操作时, 正在编辑的文件的保存问题
3. 日志系统
4. 疯狂ctrl+s就会疯狂触发. 来个节流吧
5. 刚打开服务器时, 如果user-config.json是空的, 应该把default-config.json复制进去, 现在需要手动处理
6. 现在文件命名允许以_开头, 那是否一级目录会命名文_images, 和目录本身的_images冲突呢
7. 现在重命名文件时, 文件不能和自己重名

#Todos 难解决
1. 如何在程序启动时锁定对应的文件夹, 防止被外部程序占用呢
2. 重命名文件夹之前, 应对锁定要进行操作的目录, 防止外界占用导致重命名失败, 现在的重命名操作, 是可能出现致命错误的, 虽然几率不大
3. 定时清理图片


## Bugs
1. ink: fold 无法折叠图片, 图片后面需要有一个空行
2. ink: imgs 有些图片无法上传
3. server: 一级目录不支持中文, 需要修复一下
4. ink: 重命名还是不区分大小写
5. 打开一个文件. 切换目录然后再切换到当前文件, 竟然会触发保存
6. 添加各个页面端元数据. 如是否折叠
7. 删除文件会露出背景图
8. 系统文件_开头改为.开头, 因为用户可以定义_开头的文件
9. 关闭md对<div>之类的自动高亮
10. 运行用户自动设置要使用哪些代码高亮(比如lua), 和代码theme
11. 字数统计统计的是字符, 需要单词

## Features
2. editor: 支持$$数学
2. editor: 支持table编辑
3. ink: 支持多窗口
3. ink: 转思维导图
4. 这个文件创建于2013年, 大一暑假时期
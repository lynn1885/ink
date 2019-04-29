# TODOS
## bugs
### file-server: 分离代码
TODO: 现在自动折叠, 标记最后一命令行的代码现在都写在file-server中
其实应该让file-server提供事件, 如onfileloaded, onfileunloaded
然后应该让自动折叠等功能监听这些事件, 以插件的形式存在
### server: catalog-order, icons
应该以(静态)文件的形式托管在后端, 这样前端就可以直接打包了. 想要更新catalog-order或者icons, 修改后端文件即可
### server: _images
现在这个文件必须得自己创建, 应该自动创建
### server: 修改备份策略
让可以备份一个月之前的文件
### ink: fold 无法折叠图片
图片后面需要有一个空行
### ink: imgs 有些图片无法上传
### server: 一级目录不支持中文, 需要修复一下

## editor
### 支持$$数学
### 支持table编辑

## features
### ink: 支持多窗口
### ink: 转思维导图
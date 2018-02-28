# wiznote2markdown
将本地为知笔记文档转换成markdown格式文件

# 方法原理
1. 读取本地为知笔记数据库index.db和文档目录
2. 解压文档将解压出来的html文件转换成markdown格式
3. 保存文档内图片到index_files目录下

# 使用方法
node wiz2md.js -h

  Usage: wiz2md <-f filepath> <-w wiznotepath -u usename -o outputdirpath>

  Options:

    -V, --version            output the version number
    -f, --file [path]        指定配置文件
    -w, --wizhome [path]     为知笔记数据目录
    -u, --username [ value]  为知笔记登录账户名
    -o, --outdir [path]      转换后的markdown文档输出目录
    -h, --help               output usage information

## 第一种
执行node wiz2md.js -f ./config.js
-f 参数指定启动配置文件config.js，配置文件中设置为知笔记数据目录，用户登录账号名，转换后输出目录
## 第二种
执行node wiz2md.js -w '/Users/yc/.wiznote' -u 'chao_china@foxmail.com' -o '/Users/yc/Desktop/tmp'

# 注意事项
1. 该工具是读取本地的为知笔记数据库进行解压转换，文档不能进行加密操作这样无法解压出来
2. 转换前需要使用为知笔记客户端将文档同步到本地磁盘上
3. 在mac下经过测试在其他系统下还没有试过

# 已知问题
1. 有一些文档会转换成乱码，猜测和解压步骤相关还没有处理
2. 转换后的markdown文档无法找到相对路径的图片


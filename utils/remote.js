/**
 * 个人配置
 */
var 用户名 = "CarsonRyan696"  //需要更换用户名
var 仓库名 = "JavaScript"     //需要更换仓库名
var 脚本名 = "测试.js"       //需要更换github中需要运行的脚本名

threads.start(main);//启动线程运行main函数
/**
 * 主函数:利用脚本引擎运行指定的代码
 */
function main() {
    console.show()    //打开控制台
    var github下载的脚本 = 下载Github文件()//这个方法返回的就是要运行的代码
    console.info("下载完成的代码为:"+'\n'+github下载的脚本)
    engines.execScript('Github下载的脚本', github下载的脚本)  //运行脚本
}

/**
 * 通过get请求从github下载zip文件
 */
function 下载Github文件() {
    try {
        var githubUrl = "https://github.com/" + 用户名 + "/" + 仓库名 + "/archive/Cloud-update.zip"
        var r = http.get(githubUrl)  //开始请求
        console.log('请求状态码Code:', r.statusCode) //请求状态码
        var zipFile = r.body.bytes() //这里下载的是二进制数据 
        if (zipFile) {
            var 代码路径 = Github文件夹(zipFile)//将请求成功的文件写入手机路径
            return files.read(代码路径)   //读取解压后脚本的内容
        } else {
            console.error('下载github代码失败')
            exit()
        }
    } catch (err) {
        console.error(err)  //抛出异常
        exit()  //退出
    }
}

/**
 * 将下载好的zip文件保存在手机
 */
function Github文件夹(zipFile) {
    var path = files.join(files.cwd(), "autojs.zip")//1、定义文件路径名  2、files.cwd()会返回:  /sdcard/脚本/  3、path=/sdcard/脚本/autojs.zip
    files.createWithDirs(path)  //开始创建文件
    console.info("创建好的文件路径path:", path)//输出创建好的文件路径
    files.writeBytes(path, zipFile)//把下载好的二进制数据写入文件中
    var r = 解压zip文件(path) //解压zip文件
    return r
}

/**
 * 在同一目录下解压zip文件
 */
function 解压zip文件(文件路径) {
    var 解压后的文件夹路径 = 文件路径.replace(".zip", "") + "/"  //利用replace方法将.zip去掉  
    com.stardust.io.Zip.unzip(new java.io.File(文件路径), new java.io.File(解压后的文件夹路径))//将zip文件进行解压
    console.warn('解压后的文件夹路径=', 解压后的文件夹路径)
    return 解压后的文件夹路径 + 仓库名 + "-Cloud-update" + "/" + 脚本名   //返回解压后的目录   返回对象：r
}

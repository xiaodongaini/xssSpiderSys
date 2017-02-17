var http = require("http"),
 url = require("url"),
 superagent = require("superagent"),
 cheerio = require("cheerio"),
 async = require("async"),
 eventproxy = require("eventproxy");

 var ep = new eventproxy();

//初始化入口页面url
 //var originUrl = "http://www.wantongsoft.com/",
 var originUrl = "http://www.1zhu.net/",
 //var originUrl = "http://www.parisezhan.com/CN/Index2.aspx",
    deleteRepeat = {},	//去重哈希数组,用于判断url是否重复的对象
    urls = [];  //获取并存储入口页面的所有url


 //判断是否是符合标准的url
 function isStandardUrl(url){
     var httpHeadReg = /^(http|https)/; //用于匹配外部链接
     //var httpReg = new RegExp("^(http|https)://([\w-]+\.)+[\w-]+(/[\w- ./?%&=]*)?");//用于匹配外部链接
     
     var httpReg=/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?/;

     //var httpReg = /^(http|https)://([\w-]+\.)+[\w-]+(/[\w- ./?%&=]*)?/;//用于匹配外部链接
     var re = new RegExp("^"+originUrl); //当前网站绝对地址正则表达式
     var jsReg = new RegExp("(^javascript:|^undefined)","i");//匹配 JavaScript: 或者undefined
     var oReg = new RegExp("://");
     // 用于去除外部链接
     if(httpReg.test(url)&&!re.test(url)){
         return false;
     }
     //用于去除类似于 tencent://message/?uin=2354453336&Site=qq&Menu=yes 的情况
     if(!httpHeadReg.test(url)&&oReg.test(url)){
        return false;
     }
     //用于去除类似于 javascript:void(0) 
     if(jsReg.test(url)){
         return false;
     }
     return true;
 }

 //判断url是否重复
 function isRepeat(url){
     if(deleteRepeat[url] == undefined){
         deleteRepeat[url] = 1;
         return 0;
     }else if(deleteRepeat[url] == 1){
         return 1;
     }
 }
 

//主程序 start
 function start(){
    function onRequest(req,res){
        //设置字符串编码，否则中文会出现乱码
        res.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});

        superagent.get(originUrl)
	        .end(function(err,pres){
                console.log('fetch ' + originUrl + ' successful');
		        res.write('fetch ' + originUrl + ' successful<br/>');
                if(err){
                    console.log("error:");
                    console.log(err);
                }
                var $ = cheerio.load(pres.text);
                //获取所有的a标签
                var curPageUrls = $('a');
                for(var i = 0; i<curPageUrls.length; i++){
                    var linkUrl = curPageUrls.eq(i).attr('href');
                    if(isStandardUrl(linkUrl)){
                        urls.push(linkUrl);
                        ep.emit('linkUrlHtml',linkUrl);
                    }
                }
            });

        //当所有的 'linkUrlHtml'事件完成后，回调触发下面事件
        ep.after('linkUrlHtml',urls.length,function(linkUrls){
            console.log(linkUrls.length);
            //linkUrls 是一个集合
            console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<------start");
            try{
                for(var i = 0; i <linkUrls.length; i++){
                    res.write(linkUrls[i]+'<br/>');
                    console.log(linkUrls[i]+"             "+i);
                }
            }catch(e){
                console.log("显示url错误:");
                console.log(e);
            }
            console.log("end------>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
        })
    }

    http.createServer(onRequest).listen(4000);
 }

 exports.start = start;


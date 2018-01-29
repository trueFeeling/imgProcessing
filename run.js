let http = require('http');
let fs = require('fs');
// documentRoot：你的项目文件根目录
let documentRoot = 'D:/image_processing';
let server= http.createServer(function(req,res){
    let url = (req.url != '/') ? req.url : "/image.html"; 
    let file = documentRoot + url;
    console.log(url);
    fs.readFile( file , function(err,data){
        if(err){
            res.writeHeader(404,{
                'content-type' : 'text/html;charset="utf-8"'
            });
            res.write('<h1>404 NOT FOUND</h1><p>你要找的页面不存在</p>'+'<p>'+err+'</p>');
            res.end();
        }else{
            res.writeHeader(200,{
                'content-type' : 'text/html;charset="utf-8"'
            });
            res.write(data);
            res.end();

        }

    });



}).listen(3000);
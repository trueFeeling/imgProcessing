(function (global) {
    let Img = function () {
        this.version = "0.1.0";
    }

    let imgProto = Img.prototype;

    imgProto = {
        constructor: Img,
        modules: {},
        config: {
            imgSrc: [],
            imgWH: []
        },

        baseUrl: (function (currentUrl) {
            currentUrl = currentUrl.substr(0, currentUrl.lastIndexOf('/'));
            return currentUrl
        })(location.href),

        init: function (len) {
            if (this.config.imgSrc.length === 0) {
                console.log("image's src property is undefined")
                return
            }
            let imgSrcArray = this.config.imgSrc;
            let imgArray = [];
            let num = 0;
            let canvas, cacheArray, newImg;
            let lens = len || 0; 
            // initialize the image and its corresponding canvas
            for(let i = lens;i<imgSrcArray.length;i++){
                el = imgSrcArray[i];
                if (!this.modules.hasOwnProperty(el)) {
                    //canvas = document.createElement('canvas');
                    //ctx = canvas.getContext('2d');
                    //canvas.id = el + num;
                    imgArray[num] = new Image();
                    //由于imgArry[index]是一个对象
                    imgArray[num].src = el;
                    //imgArray[num].canvas = canvas;
                    //imgArray[num].ctx = ctx;
                    //pushlModule
                    console.log('el:  ', el)
                    this.pushImg(this.resolvePath(el));
                    num++;
                }
            }
            this.run(imgArray);
        },

        run: function (imgArray) {
            //check what "this" is in foreach
            let _self = this;
            let cacheArray = [];
            imgArray.forEach((img, index) => {
                img.onload = function () {
                    // intall a image module
                    _self.installImg(this.src, this);
                    defineCanvas(img);
                    // notify the proxy that this image has been loaded
                    this.ctx.drawImage(this,0,0);
                    this.cacheData = img.ctx.getImageData(0,0,img.width,img.height);
                    _self.proxy.notify(this.src);
                }
            });
            //check taskList...
            if (typeof imgArray[0] === 'object') {
                imgArray.forEach((img, index) => {
                    cacheArray[index] = img.src;
                });
            }
            
            this.proxy.watch(cacheArray);
        },
    };

    // add a image module
    imgProto.pushImg = function (imgSrc) {
        if (!this.modules.hasOwnProperty(imgSrc)) {
            this.modules[imgSrc] = null;
        }
    };

    //if this image has been loaded, it will be installed into imgProto.modules
    imgProto.installImg = function (imgSrc, imgObj) {
        /*if (imgProto.hasImg(imgSrc)) {
            this.modules[imgSrc] = imgObj;
        }*/
        //注解：加了if判断，程序无法执行下面断：
        this.modules[imgSrc] = imgObj;
    };

    imgProto.hasImg = function (imgSrc) {
        return !!imgProto.modules[imgSrc];
    };

    imgProto.task = function (imgArray, callback) {
        if(typeof callback === 'function'){
            this.proxy.watch(imgArray, callback);
        }else{
            this.proxy.watch(imgArray);
        }

    };

    imgProto.resolvePath = function (pathArray) {
        let rootDirectory = location.protocol + '//' + location.host;
        if(pathArray[0].length === 0){
            return pathArray
        }
        pathArray = pathArray instanceof Array ? pathArray : [pathArray];
        pathArray.forEach((path, index) => {
            if (path.match(/.*:\/\/.*/)) {
                // images of uri
                // do nothing
            } else if (path.charAt(0) === '/') {
                path = rootDirectory + path;
            } else {
                paths = path.split('/');
                resPaths = this.baseUrl.split('/');
                for (var i = 0; i < paths.length; i++) {
                    if (paths[i] === '..') {
                        resPaths.pop();
                    } else if (paths[i] === '.') {
                        // do nothing
                    } else {
                        resPaths.push(paths[i]);
                    }
                }
                path = resPaths.join('/');
            }
            pathArray[index] = path;
        });

        return pathArray;
    };

    //proxy

    imgProto.proxy = (function () {
        let proxy = {},
            taskId = 0,
            taskArray = [],
            taskList = {},
            taskImg = [];

        let execute = function (src) {
            /*
            var uris = task.uris,
            callback = task.callback;
            for (var i = 0, arr = []; i < uris.length; i++) {
                arr.push(zmm._modules[uris[i]]);
            }
            callback.apply(null, arr);
            */
            //
                for (key in taskList) {
                    //遍历有没有依赖该image的任务
                    if (!taskList.hasOwnProperty(key)) {
                        continue
                    }
                    console.log(taskList[key].imgSrc,taskList[key].imgSrc.length)
                    if(taskList[key].imgSrc.length>1){
                        //说明此时的img含有一个任务，这个任务同时依赖与其他任务
                        let task = taskList[key].imgSrc;
                            taskList[key].imgSrc.forEach(imgSrc=>{
                                if (imgSrc === src){
                                    //说明该任务依赖队列里有该image
                                    taskList[key].len--;             
                                }else if(imgProto.hasImg(imgSrc)){
                                    taskList[key].len--;
                                }
                            });
                            if(taskList[key].len <= 0){
                                //全被装载好
                                let taskImmediateArr = [];
                                console.log('taskList[key]:',taskList[key].imgSrc)
                                for(val of taskList[key].imgSrc){
                                    taskImmediateArr.push(imgProto.modules[val])
                                }
                                console.log('muti tasks: ',taskImmediateArr)
                                taskList[key].imgTask.apply(imgProto,taskImmediateArr);
                                delete taskList[key]
                            }
                    }else if(taskList[key].imgSrc.indexOf(src)>-1){
                            //说明该任务依赖队列里有该image
                            taskList[key].imgTask.call(imgProto,imgProto.modules[src]);
                            delete taskList[key];
                        }
                }
            //taskList[0].imgTask[0].apply(null, taskImgArray);
        };

        proxy.watch = function () {
            // add each piece of images into the taskList
            let imgArray = arguments[0];
            let Fn = arguments[1] || '';
            imgArray = (imgArray instanceof Array) ? imgArray : [imgArray];
            console.log(imgArray,': ',imgArray[0].length)
            imgArray = imgProto.resolvePath(imgArray);
            let sum = 0;
            let index = 0;
            let len;
            //如果是空数组，那么表面创建了一个空白canvas
            //必须有回调，才允许创建
            console.log(imgArray)
              if(imgArray[0].length === 0){
               imgProto.config.imgSrc.push('canvas');
               let src = imgProto.config.imgSrc.length-1;
               //installImg
               imgProto.pushImg('canvas'+src);
                    //let canvas = document.createElement('canvas'),
                    //img.canvas = canvas;
                    let canvasObj = {};
                    defineCanvas(canvasObj,src);
                    imgProto.installImg('canvas'+src,canvasObj);
                    console.log('canvasObj',canvasObj.canvas);
                    console.log('Fn: ',Fn)
                    Fn.call(imgProto,canvasObj);
                    //sum = 0;
                    //delete taskList[taskId+ '']
                    //taskId++;
                    return
              }
            imgArray.forEach((img, index) => {
                if (!imgProto.modules.hasOwnProperty(img)) {
                    //没有配置，现在进行配置
                    len = imgProto.config.imgSrc.length || 0;
                    imgProto.config.imgSrc.push(img);
                    //imgProto.init(Fn);
                    //新添加
                    imgProto.init(len);
                }
            });
            if (arguments.length === 2) {
                //对应imgProcess.task(['./lena.jpg'],callback)
                //模块push完：添加任务队列
                for(val of imgArray){
                    if(imgProto.hasImg(val)){
                        sum++
                    }
                }
                console.log('imgArray: LEN:',imgArray)
                taskList[taskId + ''] = {
                    imgSrc: imgArray,
                    imgTask: Fn,
                    len: imgArray.length || 0
                };
                if (sum === imgArray.length) {
                    //模块都加载好了
                    let imgObjArray = [];
                    for(imgMod of imgArray){
                        imgObjArray.push(imgProto.modules[imgMod]);
                    }
                    Fn.apply(imgProto,imgObjArray);
                    sum = 0;
                    delete taskList[taskId+ '']
                }
                taskId++;
            }
           
        }

        proxy.notify = function (imgSrc) {
            execute(imgSrc)
        }

        return proxy
    })()

    imgProto.utils = (function () {
        //set a matrix whose values are zero

        function _imread(img){
            let canvasData = img.ctx;
            img.rgb = canvasData.getImageData(0,0,img.width,img.height);
        }

        function _toMatrix(img) {
            let cacheObj = {},
                width = img.width,
                height = img.height,
                data = img.rgb.data;
                cacheObj.r = this.zeros(width, height),
                cacheObj.g = this.zeros(width, height),
                cacheObj.b = this.zeros(width, height);
            for (let k = 0; k < width; k++) {
                for (let j = 0; j < height; j++) {
                    cacheObj.r[k][j] = data[(k * img.width * 4 + 4 * j) + 0];
                    cacheObj.g[k][j] = data[(k * img.width * 4 + 4 * j) + 1];
                    cacheObj.b[k][j] = data[(k * img.width * 4 + 4 * j) + 2];
                }
            }
            [img.r,img.g,img.b]=[cacheObj.r,cacheObj.g,cacheObj.b];
        };

        function _cat(img){
            let data = img.rgb.data,
                width = img.width,
                height = img.height;
            for(let k=0;k<width;k++){
                for(let j=0;j<height;j++){
                    data[(k*width*4+4*j)+0] = img.r[k][j];
                    data[(k*width*4+4*j)+1] = img.g[k][j];
                    data[(k*width*4+4*j)+2] = img.b[k][j];
                }
            }
            img.ctx.putImageData(img.rgb, 0, 0);
        }

        function _rgb2gray(img) {
            let width = img.width,
                height = img.height,
                data = img.rgb.data,
                gray = this.zeros(width, height);
            for (let k = 0; k < width; k++) {
                for (let j = 0; j < height; j++) {
                    gray[k][j] = img.r[k][j] * 0.3 + img.g[k][j] * 0.59 + img.b[k][j] * 0.11;
                }
            }

            //对r,g,b分量进行了处理，所以r,g,b分量也需要更新
            for (let k = 0; k < width; k++) {
                for (let j = 0; j < height; j++) {
                    data[(k * width * 4 + 4 * j) + 0] = gray[k][j];
                    data[(k * width * 4 + 4 * j) + 1] = gray[k][j];
                    data[(k * width * 4 + 4 * j) + 2] = gray[k][j];
                    img.r[k][j] = gray[k][j];
                    img.g[k][j] = gray[k][j];
                    img.b[k][j] = gray[k][j];
                    //this.rgb.data[(k*this.width*4+4*j)+3] = 255;
                }
            }
            //this.rgb.data[0]=0;
            img.ctx.putImageData(img.rgb, 0, 0);
        }


        function _zeros() {
            let row, col;
            let cacheArray = [],
                [len_row, len_col] = arguments;
            if (arguments.length == 1) {
                //zeros(N) means N*N
                for (row = 0; row < len_row; row++) {
                    cacheArray[row] = [];
                    for (col = 0; col < len_row; col++) {
                        cacheArray[row][col] = 0;
                    }
                }
            }
            if (arguments.length == 2) {
                //zeros(M,N) means M*N
                for (row = 0; row < len_row; row++) {
                    cacheArray[row] = [];
                    for (col = 0; col < len_col; col++) {
                        cacheArray[row][col] = 0;
                    }
                }
            }
            return cacheArray
        }

        function _size(arr) {
            if (!Array.isArray(arr)) {
                return
            }
            col = arr.length;
            row = arr[0].length;
            return {
                col: col,
                row: row
            }
        }

        function rotate(matrix, degree) {
            if (!Array.isArray(matrix)) {
                return
            }
            let row, col;
            let cacheArray = [];
            if (degree == 90) {
                matrix.forEach((el, row, arrRow) => {
                    arrRow[row].forEach((el, col, arrCol) => {
                        arrCol[col]
                    })
                })
            }
        }

        function _transpose(matrix) {
            if (!Array.isArray(matrix)) {
                return
            }
            let row, col;
            let [len_row, len_col] = [matrix.length, matrix[0].length];
            /** if the input matrix is like [1,2,3]
             *  then its len_col is 'undefined'
             *  but we still assume it is a 1*3 matrix
             */
            let cacheArray = (typeof len_col === 'undefined') ? this.utils.zeros(len_row, 1) : this.utils.zeros(len_col, len_row);
            for (row = 0; row < len_row; row++) {
                if (typeof len_col === 'undefined') {
                    cacheArray[row][0] = matrix[row];
                } else {
                    for (col = 0; col < len_col; col++) {
                        cacheArray[col][row] = matrix[row][col]
                    }
                }
            }
            return cacheArray

        }

        return {
            zeros: _zeros,
            size: _size,
            transpose: _transpose,
            imread: _imread,
            toMatrix: _toMatrix,
            cat: _cat,
            rgb2gray: _rgb2gray
        }
    })();

    for (key in imgProto.utils) {
        imgProto[key] = imgProto.utils[key];
    }
    //监听width,height
    function defineCanvas(){
        //console.log('define\'s',img)
        let defineData = ['width','height'],
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            img = arguments[0];
            img.ctx = ctx;
            canvas.id = typeof img.src === 'undefined' ? arguments[1] : imgProto.config.imgSrc.indexOf(img.src);
            img.canvas = canvas;
            console.log('img.canvas: ',img.canvas)
            img.canvas.width = img.width == 0 ? img.canvas.width : img.width;
            img.canvas.height = img.height ==0 ? img.canvas.height : img.height;
            defineData.forEach(key=>{
                Object.defineProperty(img.ctx, key,{
                    enumerable:true,
                    configurable:true,
                    get: function proxyGetter(){
                        console.log("canvas's ",img.canvas[key]);
                        return img.canvas[key]
                    },
                    set: function proxySetter(newVal){
                        if(newVal === canvas[key]){
                            return
                        }
                        //repaint
                        //imageData = img.ctx.getImageData(0,0,img.width,img.height);
                        //触发重绘
                        img.canvas[key] = newVal;
                        img[key] = newVal;
                        if(img instanceof Image){
                            img.ctx.drawImage(img,0,0,img.canvas.width,img.canvas.height);
                            img.cacheData = img.ctx.getImageData(0,0,img.canvas.width,img.canvas.height);
                            img.ctx.putImageData(img.cacheData,0,0);
                        }else{
                            //let cn = document.getElementById(img.canvas.id);
                            //img.ctx.drawImage(cn,0,0,img.canvas.width,img.canvas.height);
                            //img.cacheData = img.ctx.getImageData(0,0,cn.width,cn.height);
                            //img.ctx.putImageData(img.cacheData,0,0);
                        }
                    }
                });
            })
    }
    global.imgProcess = imgProto;
})(window)



# imgProcessing

类似require的写法，讲图片视为模块，调用imgProcess.task，轻松进行图像处理

## 整体思路
首先，img的onload事件触发的时候，notify代理，查看任务队列里面有没有依赖该img的任务(参考了浏览器的执行机制)。当遍历到当前taskList的imgSrc是一个长度大于1的数组的时候，说明这个taskList还依赖于其他图片，此时img加载好，就讲len属性减一。

当len属性为0的时候，说明这个imgSrc所包含的img都已经加载好。此时开始执行任务。
```JavaScript
//每个任务是一个对象
//imgSrc是一个数组
taskList[taskId + ''] = {
    imgSrc: imgArray,
    imgTask: Fn,
    len: imgArray.length || 0
};
```

由于canvas的大小改变，会引起重绘。使用Object.defineProperty()，当img.ctx.width或者img.ctx.height属性更改的时候，触发canvas的大小改变(初始化的时候canvas和img的大小一致)，同时将img重绘在canvas上(canvas和img的大小始终保持一致)
```javascript
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
            //Todo
            }
        }
});
```

```javascript
// 不做任何处理
imgProcess.task(['/img/timg.jpg','/lena.jpg'], function(img1,img2){
    document.body.appendChild(img1.canvas);
});
// 对图像进行处理
imgProcess.task(['/img/timg.jpg','/lena.jpg'], function(img1,img2){
    //读取img2数据
    //读取完之后, img会被添加r,g,b三个分量
    this.imread(img2);
    //toMatrix表示采用二维矩阵的方式处理
    this.toMatrix(img2);
    //灰度处理
    this.rgb2gray(img2);
    //对r,g,b三个分量进行转置
    [img2.r,img2.g,img2.b] = [this.transpose(img2.r),this.transpose(img2.g),this.transpose(img2.b)];
    //显示处理结果
    this.cat(img2);
    document.body.appendChild(img2.canvas);
});
```
# Todo
- [x] 搭建好基础框架
- [ ] 添加更多图像处理的功能函数
- [ ] 完善功能演示demo
- [ ] 进一步优化框架代码

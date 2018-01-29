# imgProcessing

类似require的写法，讲图片视为模块，调用imgProcess.task，轻松进行图像处理
```javascript
imgProcess.task(['/img/timg.jpg','/lena.jpg'], function(img1,img2){;
    document.body.appendChild(img1.canvas);
    let p =document.createElement('p');
    p.innerHTML = '23333333333';
    document.body.appendChild(p)
});
```
# Todo
- [x] 搭建好基础框架
- [ ] 添加更多图像处理的功能函数
- [ ] 完善功能演示demo
- [ ] 进一步优化框架代码

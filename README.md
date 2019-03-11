# mc-scroll
## 组件简介
* 移动端滚动组件
* 原生无依赖，针对列表类场景，压缩前只有14K
* 支持上拉加载、下拉刷新、惯性滚动&回弹
* 只兼容移动端


## 组件包含文件：
* mc-scroll.js - 组件主功能
* mc-scroll.css - 组件样式


## DEMO：
![Image text](http://demo.rabifoo.com/scroll/qrcode.png)


## 使用方法：

*HTML*

``` html
<link rel="stylesheet" href="./src/mc-scroll.css">

<div class="McScroll">
  <div class="McScroll-main" id="main">
    <ul>
      <li>Title_1</li>
      <li>Title_2</li>
      <li>Title_3</li>
      <li>Title_4</li>
      ...
    </ul>
  </div>
</div>

<script src="./src/mc-scroll.js"></script>
```

*JavaScript(Global)*
``` javascript
new McScroll('main', {
    pullDown: {
        enabled: true,
        handler: (success, self) => {
            //...
            success();
        }
    },
    pullUp: {
        enabled: true,
        handler: (success, self) => {
            //...
            success();
        }
    }
})
```


## 配置参数

|  params  |  type  |  description  |
|------|------|------|
|  pullDown  |  Object  |  下拉动作  |
|  pullUp  |  Object  |  上拉动作  |
|  [pull**]-enabled  |  Boolean  |  是否启用。默认：false  |
|  [pull**]-height  |  Number  |  拖动触发事件距离。默认：36  |
|  [pull**]-html  |  Object  |  相应状态显示内容  |
|  [pull**]-html-enabled  |  Boolean  |  是否启用。默认：true  |
|  [pull**]-html-before  |  String  |  默认状态。默认：pull to refresh / pull to load  |
|  [pull**]-html-active  |  String  |  激活状态。默认：release to refresh / release to load  |
|  [pull**]-html-after  |  String  |  等待状态(触发回调)。默认：refreshing... / loading...  |
|  [pull**]-handler  |  Function  |  下拉/上拉回调方法。行参携带（success, self），完成相关业务逻辑后调用success()回到可滑动状态。  |
|    |    |    |
|  onScroll  |  Function  |  滚动触发回调。行参携带（y, self），y为当前Y轴坐标。  |
|  onScrollEnd  |  Function  |  滚动结束触发回调。行参携带（y, self），y为当前Y轴坐标。  |
|  onInit  |  Function  |  组件初始化触发回调。行参携带（self），self为实例本身。  |


## 方法

|  method  |  params  |  description  |
|------|------|------|
|  pullOff  |  type["pullDown"/"pullUp"],  html[String]  |  关闭 下拉/上拉 功能，并设置块内显示内容  |
|  pullOn  |  type["pullDown"/"pullUp"]  |  开启 下拉/上拉 功能  |
|  pullHTML  |  type["pullDown"/"pullUp"],  html[String]  |  设置块内显示内容  |
|  scrollTo  |  y[Number], animate[Boolean]  |  滚动到指定位置。animate代表滑动或位移  |
|  triggerHandler  |  type["pullDown"/"pullUp"]  |  触发 下拉/上拉 的回调  |
|  pullSuccess  |    |  调用解除 下拉/上拉 的锁定状态。即[pull**]-handler行参携带的success。  |

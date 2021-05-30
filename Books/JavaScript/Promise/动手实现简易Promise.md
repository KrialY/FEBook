# 动手实现简易Promise

Promise.all

```javascript
MyPromise.all = function (values) {
  return new MyPromise((resolve, reject) => {
    var arr = [];
    var index = 0;
    
    function processData (key, value) {
      index++;
      arr[key] = value;
      if (index == values.length){
          resolve(arr);
      }
    }
    for(let i=0;i<values.length;i++) {
      values[i].then((data) => {
        // 问：为何这里要使用函数处理？
        // 答：因为then的调用时机是不确定的，所以可能会存在i=values.length-1对应的then先调用，这就导致了并不是promise对象都resolve了却提前调用了all
        // 解决方案：重新设立一个计数器index来计数，每次每个promise resolve之后index会加一直到index等于所有promise的数量时方可将Promise.all回调
        processData(i, data);
      },reject)
    }
  })
}
```
Promise
```javascript

```
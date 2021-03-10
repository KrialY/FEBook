# Es6 plus

## 迭代器与生成器
[迭代器与生成器的基本用法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Iterators_and_Generators)
## async与await语法糖
[async与await的基本用法](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)

#### 如何实现async与await？
async/await的目的为了简化使用基于promise的API时所需的语法。async/await的行为就好像搭配使用了生成器和promise。
async其实就是生成器结合co模块的语法糖。我们知道生成器是需要手动迭代的，这就出现了co模块，用于自动迭代。而async就相当于是官方提供了generator+co的实现。

下面是一些具体的例子：
首先看个场景，我们现在需要读取文件B的信息，但是这个文件B的读取密码我们并不知道，另外一个文件A知道，所以要读取文件B的信息就得先去读取文件A中的信息，然后根据文件A中的信息来读取文件B信息，两者属于依赖关系。
原始方式实现：
````javascript
fs.readFile("src/fileA.txt", "utf8", (err, data) => {
  const resA = data;
  console.log(resA);
  fs.readFile(`src/${resA}`, "utf8", (err, data) => {
    console.log(data);
  });
});
````
Promise实现：
````javascript
function readFileByPromise(fileName) {
  return new Promise((resolve) => {
    fs.readFile(`src/${fileName}`, "utf8", (err, data) => {
      resolve(data);
    });
  });
}
readFileByPromise("fileA.txt")
  .then((resA) => {
    return readFileByPromise(resA);
  })
  .then((resB) => {
    console.log(resB);
  });
````
迭代器与生成器实现
````javascript
function readFileByPromise(fileName) {
  return new Promise((resolve) => {
    fs.readFile(`src/${fileName}`, "utf8", (err, data) => {
      resolve(data);
    });
  });
}
function* readFileIterator(fileName) {
  const resA = yield readFileByPromise(fileName);
  const resB = yield readFileByPromise(resA);
  return resB;
}
const it = readFileIterator("fileA.txt");
const { value, done } = it.next();
Promise.resolve(value).then((resA) => {
  const { value, done } = it.next(resA);
  console.log(resA, done);
  Promise.resolve(value).then((resB) => {
    console.log(resB);
  });
});
````
这里需要我们去手动通过iterator.next()的方式手动迭代

迭代器与[Co](https://github.com/tj/co)结合实现
````javascript
function readFileByPromise(fileName) {
  return new Promise((resolve) => {
    fs.readFile(`src/${fileName}`, "utf8", (err, data) => {
      resolve(data);
    });
  });
}
function* readFileIterator(fileName) {
  const resA = yield readFileByPromise(fileName);
  const resB = yield readFileByPromise(resA);
  return resB;
}
function co(it) {
  return new Promise((resolve, reject) => {
    function next(data) {
      var { value, done } = it.next(data);
      if (!done) {
        Promise.resolve(value).then((data) => {
          next(data);
        }, reject);
      } else {
        resolve(data);
      }
    }
    next();
  });
}
const it = readFileIterator("fileA.txt");
co(it).then((data) => {
  console.log(data);
});
````
这里我们用递归的方式实现了内部迭代，所以直接就能拿到最后的结果

Async方式实现：
````javascript
async function readFileByAsync(fileName) {
  const resA = await new Promise((resolve) => {
    fs.readFile(`src/${fileName}`, "utf8", (err, data) => {
      resolve(data);
    });
  });
  const resB = await new Promise((resolve) => {
    fs.readFile(`src/${resA}`, "utf8", (err, data) => {
      resolve(data);
    });
  });
  return resB;
}
const res = readFileByAsync("fileA.txt");
res.then((resB) => {
  console.log(resB, "end~");
});
````
官方语法糖提供co + 迭代器的功能
[所有代码试例-CodeSandbox](https://codesandbox.io/s/vigorous-lumiere-616b2?file=/src/index.js)
# Express
本章节是对Express一些核心功能的实现。
## Express中间件
核心实现
````javascript
function express () {
  var queue = [];

  var app = function (req, res) {
    var i = 0;
    function next () {
      var task = queue[i++];
      if(!task) return;
      task(req, res, next);   
    } 
      next();
  }
  app.use = function (task) {
    queue.push(task);
  }
  return app;
}
var app = express();
````
当我们使用app.use注册中间件的时候，express内部会有一个队列来维护所有中间件的调用，遵循先入先出的原则。当发生请求时，会从队列头取出一个中间件执行，并且把下一个中间件（即next）传给当前执行的中间件，由当前的中间件来控制下个中间件的执行时机。
## Express路由
````javascript
let http = require("http");
const url = require("url");

function createApp () {
  let app = function(req, res) {
    console.log(res);
    let requestMethod = req.method.toLocaleLowerCase();
    let pathName = url.parse(req.url, true).pathname;

    app.routes.forEach(layer => {
      let {
        method,
        path,
        handler
      } = layer;

      if(method === requestMethod && path === pathName) {
        handler(req, res);
      }
    })
  }
  app.routes = [];
  let methods = http.METHODS;
  methods.forEach(method => {
    method = method.toLowerCase();
    app[method] = function (path, handler) {
      let layer = {
        method,
        path,
        handler
      }
      app.routes.push(layer);
    }
  });
  app.listen = function () {
    let server = http.createServer(app);
    server.listen(...arguments);
  }
  return app;
}
module.exports = createApp;
````
设置一个队列来维护所有路由，当我们访问相应的路径的时候，通过队列的遍历来匹配相应条件的路由，最后调用相应的回调函数即可。
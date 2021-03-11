
// 为Vue实例中data中的属性定义defineProperty
class Observer {
  constructor (data) {
      this.data = data;
      // console.log(data);
      this.walk(data);
  }
  walk (data) {
      if (!data || typeof data !== "object") {
          return;
      }
      Object.keys(data).forEach((key) => {
          this.defineReactive(data, key, data[key]);
      });
  }
  defineReactive (data, key, val) {
      // 为data中每个属性创建一个发布订阅模式中的代理，用于发布与订阅
      let dep = new Dep();
      Object.defineProperty(data, key, {
          enumerable: true,
          configurable: false,
          get () {
              // 我们需要把data中的属性与vue文件中的指令连接起来，这里的Dep.target指的是每个Watcher实例，其中每个Watcher实例与vue文件中节点上的指令绑定
              Dep.target && dep.addSub(Dep.target);
              console.log('get');
              return val;
          },
          set (newVal) {
              console.log('set');
              val = newVal;
              // 如果data中的属性发生了变化，那么通知所有与data中属性绑定的Watcher重新渲染
              dep.notify();
          }
      });
      console.log(typeof val);
      this.walk(val);
  }
}
// 编译vue文件中的节点上的指令与Vue实例中的data建立连接
class Compiler {
  constructor (context) {
      this.$el = context.$el;
      this.context = context;
      console.log(context);
      if (this.$el) {
          this.$fragment = this.nodeToFragment(this.$el);
          this.compiler(this.$fragment);
          this.$el.appendChild(this.$fragment);
      }
  }

  nodeToFragment (node) {
      let fragment = document.createDocumentFragment();
      if (node.childNodes && node.childNodes.length) {
          node.childNodes.forEach((child) => {
              if (!this.ignorable(child)) {
                  fragment.appendChild(child);
              }
          });
      }
      return fragment;
  }

  ignorable (node) {
      let reg = /^[\t\r\n]+/;
      return node.nodeType === 8 || (node.nodeType === 3 && reg.test(node.textContent));
  }

  compiler (node) {
      if (node.childNodes && node.childNodes.length) {
          node.childNodes.forEach((child) => {
              if (child.nodeType === 1) {
                  this.compilerElementNode(child);
              }else if(child.nodeType === 3) {
                  this.compilerTextNode(child);
              }
          });
      }
  }

  compilerElementNode (node) {
      let attrs = [...node.attributes];
      let self = this;
      
      attrs.forEach(attr => {
          let { name: attrName, value: attrValue} = attr;
          console.log(attrName, attrValue);
          if (attrName.indexOf("v-") === 0 ){
              let dirName = attrName.slice(2);
              switch (dirName) {
                  case "text":
                      new Watcher(attrValue, this.context, newVal => {
                          node.textContent = newVal;
                      });
                      break;
                  case "model":
                      new Watcher(attrValue, this.context, newVal => {
                          node.value = newVal;
                      });
                      node.addEventListener("input", (e) =>{
                          self.context[attrValue] = e.target.value;
                      });
                      break;
              }
          }
          if (attrName.indexOf("@") === 0) {
              this.compilerMethods(this.context, node, attrName, attrValue);
          }
      })
      this.compiler(node);
  }

  compilerMethods (scope, node, attrName, attrValue) {
      let type = attrName.slice(1);
      let fn = scope[attrValue];
      node.addEventListener(type, fn.bind(scope));
  }

  compilerTextNode (node) {
      let text = node.textContent.trim();
      // console.log(node);
      let exp = this.parseTextExp(text);
      new Watcher(exp, this.context, function (newVal) {
          node.textContent = newVal;
      });
      
      console.log(exp);
  }

  parseTextExp (text) {
      let regText = /\{\{(.+?)\}\}/g;
      let pieces = text.split(regText);
      console.log(pieces);
      let matches = text.match(regText);

      let tokens = [];
      pieces.forEach((item) => {
          if (matches && matches.indexOf("{{" + item + "}}") > -1) {
              tokens.push("("+ item + ")");
          }else{
              tokens.push("`" + item + "`");
          }
      });
      return tokens.join("+");
  }
}
var $uid = 0;
class Watcher {
  constructor (exp, context, cb) {
      this.exp = exp;
      this.context = context;
      this.cb = cb;
      this.uid = $uid++;
      this.update();
  }

  get () {
      Dep.target = this;
      let newVal = Watcher.computeExpression(this.exp, this.context);
      Dep.target = null;
      return newVal;
  }

  update () {
      let newVal = this.get();
      console.log(newVal);
      this.cb && this.cb(newVal);
  }
  // 该方法会从vue实例中取data中的数据，读取数据就会触发对应数据的defineProperty中的get，get方法便会把当前Watcher添加到代理中去，从而建立联系
  static computeExpression (exp, scope) {
      console.log(scope.msg, "msgmsg....");
      let fn = new Function("scope", "with(scope){ return "+ exp +" }");
      return fn(scope);
  }
}
// 发布订阅者模式中的代理（Proxy），专门用于添加联系与publish
class Dep {
  constructor () {
      this.subs = {};

  }

  addSub (target) {
      this.subs[target.uid] = target;
  }

  notify () {
      for (let attr in this.subs) {
          this.subs[attr].update();
      }
  }
}
class MyVue {
  constructor (options) {
      this.$el = document.querySelector(options.el);

      this.$data = options.data || {};
      this.__proxyData (this.$data);
      this.__proxyMethods(options.methods);
      new Observer(this.$data);
      new Compiler(this);
  }
  // 代理，主要作用只是让我们能够通过vue.msg的方式就可以获取vue实例中data中的数据（vue.data.msg）
  __proxyData (data) {
      Object.keys(data).forEach(key => {
          Object.defineProperty(this, key, {
              get () {
                  return data[key];
              },
              set (newVal) {
                  data[key] = newVal;
              }
          })
      })
  }
  __proxyMethods (methods) {
      if (methods && typeof methods === "object") {
          Object.keys(methods).forEach(key => {
              this[key] = methods[key];
          })
      }
  }
}
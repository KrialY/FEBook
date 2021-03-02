# React核心架构Fiber解析——入门篇

> 首先，写这篇文章的主要目的是想让大家能够知道为什么Fiber架构能够提高性能，让页面渲染更加流畅，从而提高用户体验。这里，我以一个初学者的角度去写了这篇文章，这篇文章中也回答了我初学Fiber过程中的种种疑问，算是一篇入门的文章，希望能帮助到大家。

## 前置学习

#### 帧

目前大多数设备的屏幕刷新率为60次/秒

当每秒绘制的帧数（FPS）达到60时，页面时流畅的，小于这个值时，用户会感觉到卡顿，因此为了防止界面卡顿，每个帧的预算时间时16.66毫秒（1秒/60）

每个帧的开头包括样式计算、布局和绘制

JavaScript执行的JavaScript引擎线程和GUI渲染线程是互斥的

![image-20201118101416004](https://gitee.com/krialy/images/raw/master/source/20210302175718.png)

如果某个JavaScript某个任务执行时间过长，会阻塞GUI渲染页面

![image-20201121205334272](https://gitee.com/krialy/images/raw/master/source/20210302175739.png)

![image-20201118093003534](https://gitee.com/krialy/images/raw/master/source/20210302175806.png)

#### 丢帧

![image-20201122163103566](https://gitee.com/krialy/images/raw/master/source/20210302175851.png)

在一个标准帧渲染时间16.7ms之内，浏览器需要完成Main线程的操作，并commit给Compositor进程

![image-20201121204312674](https://gitee.com/krialy/images/raw/master/source/20210302175904.png)

主线程里操作太多，耗时长，commit的时间被推迟，浏览器来不及将页面draw到屏幕，这就丢失了一帧。

> 更多内容可参考——[Google Developers](https://developers.google.com/web/fundamentals/performance/rendering/?hl=zh-cn)

举个栗子🌰

![image-20201121210052334](https://gitee.com/krialy/images/raw/master/source/20210302175913.png)

<center><a href="https://claudiopro.github.io/react-fiber-vs-stack-demo/">React——StackVsFiber</a></center>

#### React 15

vDom Tree——相对简单的树状结构

![image-20201123103937085](https://gitee.com/krialy/images/raw/master/source/20210302175947.png)

数据结构表示：

```javascript
let el = {
  "type": "div",
  "props": {
    "id": "a1",
    "children": [
      {
        "type": "div",
        "props": {
          "id": "b1",
          "children": [
            {
              "type": "div",
              "props": {
                "id": "c1"
              }
            },
            {
              "type": "div",
              "props": {
                "id": "c2"
              }
            }
          ]
        }
      }
    ]
  }
};
```

这里有一个问题，如果节点的层级过于深，会导致递归栈过深。我们知道栈是无法中断的，所以在Diff的过程中会出现性能问题。

#### React16

这里再次放出浏览器的一帧

![image-20201121213340556](https://gitee.com/krialy/images/raw/master/source/20210302180008.png)

> 图中的Idle period对应Chrome中提供的API——[requestIdleCallback](https://developers.google.com/web/updates/2015/08/using-requestidlecallback?hl=en)

##### requestIdleCallback

* 我们希望快速响应用户，让用户直观上觉得流畅，因此不能阻塞用户的交互
* requestIdleCallback使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应
* 正常帧任务完成后没超过16ms，说明时间有富余，此时就会执行requestIdleCallback里注册的任务
* requestAnimationFrame的回调会在每一帧确定执行，属于高优先级任务，而requestIdleCallback的回调则不一定，属于低优先级任务
* requestIdleCallback执行有两种可能性：
  1. 一种是正常的空闲时间
  2. 另外一种情况是，如果浏览器长期没有任务可做，那么此时它会分配给你更多的时间——一般为50ms

以下是React16 Diff的过程中调度的过程以及策略：

![image-20201122161247158](https://gitee.com/krialy/images/raw/master/source/20210302180026.png)

对流程1、2、3进行放大

![image-20201123103830513](https://gitee.com/krialy/images/raw/master/source/20210302180047.png)



## 什么是Fiber

我们可以通过某种调度策略来合理分配CPU资源，从而提高用户的响应速度——通过Fiber架构，让自己的协调过程变成可被中断。适时地让出CPU执行权，这样可以让浏览器及时地响应优先级更高的用户交互时间，用户能够直观地感受到立刻被响应了，因此用户体验也大大地提高了

#### Fiber是一个执行单元

​	Fiber是一个执行单元，每次执行完一个执行单元，React就会检查现在还剩多少时间，如果没有时间就将控制权让出去

#### Fiber是一种数据结构

* React的做法是使用链表，每个虚拟节点内部表示为Fiber

> 使用链表的好处——暂停遍历
>
> * 在React Diff的过程中出现了中断让权等待的时候我们可以非常方便的保存状态，我们只需保存中断的链表头就行了，下次恢复状态的时候只需要根据链表头即可获取之前已经处理过的节点了

![image-20201118101922878](https://gitee.com/krialy/images/raw/master/source/20210302180120.png)

Fiber Tree的数据结构简单表示：

```javascript
Fiber{
  child, //指向唯一子节点
  return, //指向父节点
  sibling, //指向兄弟节点
  firstEffect, //指向当前节点有更新的第一个子节点
  lastEffect, //指向当前节点有更新的最后一个子节点
  nextEffect, //指向下一个要更新的子节点
  effectTag, //表示当前节点要进行何种更新
  alternate, //指向前一个树的对应节点
}
```

return用来生成Effect List，通过向上merge的方式把子Effect List向上合并，最终合并到根节点，根节点拿到Effect List就可以对相应的节点进行更新渲染了

#### Fiber执行阶段

每次渲染有两个阶段：Reconciliation（协调render阶段）和Commit（提交阶段）

* 协调阶段：可以认为是Diff阶段，这个阶段可以被中断，这个阶段会找出所有节点变更，例如节点新增、删除、属性变更等等，这些变更React称之为副作用（Effect）
* 提交阶段：将上一个阶段计算出来的需要处理的副作用（Effects）一次执行了。这个阶段必须同步执行，不能被打断

render阶段

- 以fiber tree为蓝本，把每个fiber作为一个工作单元，自顶向下逐节点构造*workInProgress tree*（构建中的新fiber tree）
- 具体过程如下（以组件节点为例）：
- 1. 如果当前节点不需要更新，直接把子节点clone过来，跳到5；要更新的话打个tag
  2. 更新当前节点状态（`props, state, context`等）
  3. 调用`shouldComponentUpdate()`，`false`的话，跳到5
  4. 调用`render()`获得新的子节点，并为子节点创建fiber（创建过程会尽量复用现有fiber，子节点增删也发生在这里）
  5. 如果没有产生child fiber，该工作单元结束，把effect list归并到return，并把当前节点的sibling作为下一个工作单元；否则把child作为下一个工作单元
  6. 如果没有剩余可用时间了，等到下一次主线程空闲时才开始下一个工作单元；否则，立即开始做
  7. 如果没有下一个工作单元了（回到了workInProgress tree的根节点），第1阶段结束，进入pendingCommit状态
- 实际上是1-6的*工作循环*，7是出口，工作循环每次只做一件事，做完看要不要喘口气。工作循环结束时，workInProgress tree的根节点身上的effect list就是收集到的所有side effect（因为每做完一个都向上归并）
- 所以，构建workInProgress tree的过程就是diff的过程，通过`requestIdleCallback`来调度执行一组任务，每完成一个任务后回来看看有没有插队的（更紧急的），每完成一组任务，把时间控制权交还给主线程，直到下一次`requestIdleCallback`回调再继续构建workInProgress tree
- P.S.Fiber之前的reconciler被称为Stack reconciler，就是因为这些调度上下文信息是由系统栈来保存的。虽然之前一次性做完，强调栈没什么意义，起个名字只是为了便于区分Fiber reconciler



react主要分以下两个阶段：（简化版）

render阶段（指的是创建fiber的过程）

1、为每个节点创建新的fiber（workInProgess）（可能是复用）生成一颗有新状态的workInProgess树

2、初次渲染的时候（或创建某个节点的时候）会为这个fiber创建真实的dom实例并且将当前节点的子节点也都插入到当前节点

3、如果不是初次渲染的话，就对比新旧的fiber状态将产生的更新的fiber节点最终通过链表的形式挂载到RootFiber上

commit阶段

1、执行生命周期

2、会将RootFiber上获取到的那条链表即EffectList根据链表上的标识来操作页面

举个栗子🌰

```react
class Home extend React.component {
  componentWillReceiveProps() {}
  componentDidMount() {}
  componentDidUpdate() {}
  componentWillUnmount() {}
  .....
  render() {
    return (
       <div class="start">
          <div class="next">
              <h1>mi1</h1>
              <h2>mi2</h2>
              <h3>mi3</h3>
          </div>
      </div>
   )
  }
}
ReactDom.render(<Home />, document.getElementById('root'))
```

以它为例创建fiber tree（初始化阶段）：

![image-20201122221551099](https://gitee.com/krialy/images/raw/master/source/20210302180150.png)

构造EffectList的流程

![image-20201118232504514](https://gitee.com/krialy/images/raw/master/source/20210302180214.png)

## Fiber中的节点复用

举个栗子🌰

这里我们继续用上面的栗子

```react
class Home extend React.component {
  static getDerivedStateFromProps(){}
  componentDidMount() {}
  .....
  render() {
    return (
       <div class="start">
          <div class="next">
              <h1>mi1</h1>
              <h2>mi2</h2>
              <h3>mi3</h3>
          </div>
      </div>
   )
  }
}
ReactDom.render(<Home />, document.getElementById('root'))
```

![image-20201122220044790](https://gitee.com/krialy/images/raw/master/source/20210302180236.png)

react应用从始至终管理着最基本的三样东西

> 1、Root（整个应用的根，它是一个对象并不是Fiber，有个属性指向current树，还有一个属性指向workInProgess树）
>
> 2、current树（树上的每个节点都是fiber，保存的是上一次的状态，并且每个fiber节点都对应着一个jsx节点）
>
> 3、workInProgess树（树上的每个节点都是fiber，保存的是本次新的状态并且每个fiber节点都对应一个jsx节点）
>
> 初次渲染的时候并没有current树，React在一开始创建Root的同时就会创建一个uninitialFiber（未初始化的fiber），同时让react的current指向uninitialFiber，之后再去创建一个本次要用到的workInProgess。

## Fiber带来的负面影响

对生命周期的影响

```javascript
// Reconciliation阶段
componentWillMount
componentWillReceiveProps
shouldComponentUpdate
componentWillUpdate
-------------------------
// Commit阶段
componentDidMount
componentDidUpdate
componentWillUnmount
```

在Reconciliation阶段Fiber架构因为使用了新的算法，也引发了一些问题，在commit阶段之前，Reconciliation阶段的所有函数都有可能会被执行多次，如果我们在生命周期阶段使用了诸如AJAX这样的异步请求，那么AJAX会被无谓地无数次调用，显然，这并不是我们想要的。这也是为什么React会在16之后的版本将componentWillReceiveProps等生命周期函数设置为unsafe的原因。

* 为什么componentWillMount、componentWillReceiveProps、componentWillUpdate这三个函数被替换成了getDerivedStateFromProps呢？
  * 首先我们看下getDerivedStateFromProps，它是一个静态函数，所以函数体内不能访问this，也就是说这是一个纯函数，纯函数有个好处就是由输入决定输出，不存在副作用的操作。所以一般开发者也不会在这里做ajax等存在副作用的操作。这样就避免了fiber架构下之前生命周期被多次调用后存在的一些bug

```javascript
static getDerivedStateFromProps(nextProps, prevState) {
  //根据nextProps和prevState计算出预期的状态改变，返回结果会被送给setState
}
```

React16.4及以后的生命周期

![image-20201122145258225](https://gitee.com/krialy/images/raw/master/source/20210302180255.png)

## Q&A

* 倘若reconcilation被中断了，是否会影响页面的效果？
  * reconcilation被中断只有可能是比它优先级更高的任务，例如用户点击事件等，显然这个时候如果reconcilation不中断才会影响用户体验
* Reconcilation是异步的，那么我们如果在Reconcilation还没完成的时候想获取布局信息是否会受到影响？
  * 并不会，如果reconcilation还没完成，我们只能获取到之前的状态，所以我们要在commit阶段之后来做这些操作
* 为什么在低优先级任务被中断了，转而去执行高优先级任务之后回来只能**重新执行**上次被中断的低优先级任务单元呢？这样不是会造成性能上的浪费吗？这也是造成为什么生命周期会被多次调用的原因
  * 重新执行——因为我们并不知道一个单元的计算时间是多少，这是会造成重新执行的直接原因，我们能做的就是在rIC中尽量对比更多的fiber。

* 使用了fiber这种数据结构是后不是会徒增性能吗？
  * 是的，会徒增性能，但是这些性能用户是感受不到的，也许你跑分高，但是你用户体验却不一定高，用户的主观感受是动画是否流畅。



> 如果有不正确的地方，小伙伴们可以直接指出，互相学习
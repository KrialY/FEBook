# useEffect

## 每一次与渲染都有它自己的Props和State

## 每一次渲染都有它自己的事件处理函数

````javascript
function Counter() {
  const [count, setCount] = useState(0);

  function handleAlertClick() {
    setTimeout(() => {
      alert('You clicked on: ' + count);
    }, 3000);
  }

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
      <button onClick={handleAlertClick}>
        Show alert
      </button>
    </div>
  );
}
````

## 每次渲染都有它自己的Effects


## useEffet的一些最佳实践

- 使用了依赖项并且只在useEffect中调用的函数应该放入useEffect中，如果放在外面会很有可能出现，在函数中增加了依赖项但是却忘记在useEffect的依赖中添加。
- 

````javascript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <h1>{count}</h1>;
}
````
这段代码只会输出0 1，然后结束。
如果你知道依赖是我们给React的暗示，告诉它effect所有需要使用的渲染中的值，你就不会吃惊了。effect中使用了count但我们撒谎说它没有依赖。
[Code Sandbox](https://codesandbox.io/s/91n5z8jo7r)

## 使用useReducer解耦useEffect中的依赖，从而减少useEffect的调用次数



## 不阻断数据流

阻断数据流常常会引发一些未知的bug，阻断数据流例如把为state赋予props传递下来的初始值。这种情况会造成父组件props改变，但是自组件并不会得到相应。

问题代码：
子组件
````javascript
export default function Test(props) {
  const [name, setName] = useState(props.name);
  return (
    <>
      <div>{name}</div>
      <div>{props.name}</div>
    </>
  );
}
````
父组件
````javascript
import Test from "./components/Test";
import { useState } from "react";

export default function App() {
  const [name, setName] = useState("Test1");
  return (
    <div className="App">
      <button
        onClick={() => {
          setName("Test2");
        }}
      >
        change name
      </button>
      <Test name={name} />
    </div>
  );
}
````
当父组件改变传入子组件的name属性的时候，子组件并没有得到相应的渲染。
[Code Sandbox](https://codesandbox.io/s/kind-feynman-3e91q?file=/src/App.js:0-465)

## 如何根据数据结构来渲染UI，从而做到更高层次的逻辑复用
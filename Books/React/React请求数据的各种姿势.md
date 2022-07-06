# React请求数据的各种姿势
## 直接在声明周期中请求数据
````javascript
export default class Normal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDataLoading: true,
      data: null
    };
  }

  async loadData() {
    const data = await fetchData("https://hn.algolia.com/api/v1/items/1");
    this.setState({
      data: data.author,
      isDataLoading: false
    });
  }

  componentDidMount() {
    this.loadData();
  }

  render() {
    return (
      <>
        {this.state.isDataLoading ? (
          <div>Loading...</div>
        ) : (
          <div>{this.state.data}</div>
        )}
      </>
    );
  }
}
````
这是比较常见的实现，个人认为这么做会有一定弊端，例如数据逻辑与UI逻辑杂糅，一定程度降低组件的拓展性与维护性。
## 使用render props
````javascript
class Controller extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isDataLoading: true,
      data: null
    };
  }

  async loadData() {
    const data = await fetchData();
    this.setState({
      isDataLoading: false,
      data: data.author
    });
  }

  componentDidMount() {
    this.loadData();
  }

  render() {
    const { isDataLoading, data } = this.state;
    return this.props.children(isDataLoading, data);
  }
}

class RenderProps extends React.Component {
  render() {
    return (
      <>
        <Controller>
          {(isDataLoading, data) => {
            return isDataLoading ? <div>Loading...</div> : <div>{data}</div>;
          }}
        </Controller>
      </>
    );
  }
}
export default RenderProps;
````
对比直接把数据与UI写到一起的写法，Render Props在一定程度上实现了UI与数据的解耦，不过又因为它的实现方式引入了负面影响，例如在UI层完全无用的Controller标签，如果使用了过多的Render Props会引发React调试困难的问题。
## 使用HOC
````javascript
function withData(WrappedComponent) {
  return class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        isDataLoading: true,
        data: null
      };
    }

    async loadData() {
      const data = await fetchData();
      this.setState({
        isDataLoading: false,
        data: data.author
      });
    }

    componentDidMount() {
      this.loadData();
    }

    render() {
      const { isDataLoading, data } = this.state;
      return (
        <WrappedComponent
          {...this.props}
          isDataLoading={isDataLoading}
          data={data}
        />
      );
    }
  };
}

@withData
class HOC extends React.Component {
  render() {
    const { isDataLoading, data } = this.props;
    return <>{isDataLoading ? <div>Loading...</div> : <div>{data}</div>}</>;
  }
}
export default HOC;
````
## 使用Hooks
````javascript
````
## 使用React Suspense

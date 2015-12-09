# redux-ui makes UI state management easy

Store transient UI state in a global reducer which blows away automatically.

### Setup

1. Add the redux-ui reducer to your reducers **under the `ui` key**:
  `combineReducers({ ...yourReducers, ui: uiReducer })`
2. In each 'scene' or parent component add the UI decorator with the key in
   which to save all state: `@ui('some-component')`
3. In each child component use the basic `@ui()` decorator; it will
   automatically read and write UI state to the parent component's UI key

### Usage:

The `@ui` decorator injects four props into your components:

1. `uiKey`: The key passed to the decorator from the decorator (eg.
   'some-decorator' with `@ui('some-decorator')`
2. `ui`: The UI state for the component's `uiKey`
3. `updateUI`: A function accepting either a name/value pair or object which
   updates state within `uiKey`
4. `resetUI`: A function which resets the state within `uiKey` to its default

The decorator will set any default state specified (see below).
On `componentWillUnmount` the entire state in `uiKey` will be set to undefined.
You can also blow away state by calling	`resetUI` (for example, on router
changes).

### Examples

```js
import ui from 'redux-ui';

// Componnet A gets its own context with the default UI state below.
// `this.props.ui` will contain this state map.
@ui({
  state: {
    filter: '',
    isFormVisible: true,
    isBackgroundRed: false
  }
})
class A extends Component {
  render() {
    return (
      <div>
        // This will render '{ "filter": '', isFormVisible: true, isBackgroundRed: false }'
        <pre><code>{ this.props.ui }</code></pre>

        // Render child B
        <B />
      </div>
    );
  }
}

// B inherits context from A and adds its own context.
// This means that this.props.ui still contains A's state map.
@ui()
class B extends Component {
  render() {
    return <C />;
  }
}

// C inherits context from its parent B. This works recursively,
// therefore C's `this.props.ui` has the state map from `A` **plus**
// `someChildProp`.
//
// Setting variables within C updates within the context of A; all UI
// components connected to this UI key will receive the new props.
@ui({
  state: {
    someChildProp: 'foo'
  }
})
class C extends Component {
  render() {
    return (
      <div>
        <p>I have my own UI state C and inherit UI state from B and A</p>
        <p>If I define variables which collide with B or A mine will
        be used, as it is the most specific context.</p>
    );
  }
}
```

### Aims

UI state:

1. Should be global
2. Should be easily managed from each component via an action
3. Should be easy to reset (manually and when unmounting)

All of these goals should be easy to achieve.

---

MIT license.

Written by [Franklin Ta](https://github.com/fta2012) and [Tony Holdstock-Brown](https://github.com/tonyhb).

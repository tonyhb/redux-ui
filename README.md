[![Circle CI](https://circleci.com/gh/tonyhb/redux-ui.svg?style=svg)](https://circleci.com/gh/tonyhb/redux-ui)

# redux-ui: ui state without profanity

Think of redux-ui as **block-level scoping** for UI state. In this example each block-scope represents a component, and each variable represents a UI state key:

```js
{
  // Everything inside this scope has access to filter and tags. This is our root UI component.
  let filter = '';
  let tags = [];

  // Imagine the following scopes are a list of to-do tasks:
  {
    // Everything inside this scope has access to isSelected - plus all parent variables.
    let isSelected = true
  }
  {
    // This also has isSelected inside its scope and access to parent variables, but
    // isSelected is in a separate scope and can be manipulated independently from other
    // siblings.
    let isSelected = false
  }
}
```

Wrap your root component with the redux-ui `@ui()` decorator.  It's given a new scope for temporary UI variables which:

- are automatically bound to `this.props.ui`
- are automatically passed any child component wrapped with the `@ui()` decorator
- will be automatically reset on componentWillUnmount (preventable via options)
- can be reset manually via a prop
- are updatable by any child component within the `@ui()` decorator

This is **powerful**. **Each component is reusable** and can still affect UI state for parent components.

### Setup

**Step 1**: Add the redux-ui reducer to your reducers **under the `ui` key**:
```js
import { reducer as uiReducer } from 'redux-ui'
// ...
combineReducers({ ...yourReducers, ui: uiReducer })
```

**Step 2**: In each 'scene' or parent component add the UI decorator with the key in
which to save all state:
```
import ui from 'redux-ui';

@ui({
  state: {
    yourVars: 'withDefaults',
    filters: []
  }
})
class YourComponent extends React.Component {
}
```

**Step 3**: In each child component use the basic `@ui()` decorator; it will
automatically read and write UI state to the parent component's UI key.

You can also define variables in child components. If your child component has
variables named the same as a parent component think of block scoping:
everything within your child component down will read from the child's scope,
but the parent will use the parent's UI variable.

### Usage

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

### Decorator API

The decorator takes an object of options:

```js
@ui({
  // optional key which is used to determine the UI path in which state will
  // be stored. if omitted this is randomly generated.
  key: 'some-name',
  // optional persist, defaults to false. if set to true persist will keep UI
  // state for this component after it unmounts. if set to false the UI state will
  // be deleted and recreated when the component remounts
  persist: true,
  // **required**: UI state for the component
  state: {
    uiVar1: '',
    // You can set default UI state based on the component's props and the
    // global store's state.
    uiVar2: (props, state) => state.router.location.query.searchTerm
  },
  // customReducer: you can handle the UI state for this component's scope by dispatching actions
  reducer: (state, action) => {
    // state represents *only* the UI state for this component's scope - not any children
    switch(action.type) {
      case '@@reduxReactRouter/routerDidChange':
        if (action.payload.location.query.extra_filters) {
          return state.set('extraFilters', true);
        }
      }
      return state;
    }
  },
  // optional mergeProps passed to react-redux' @connect
  mergeProps: () => ({}),
  // optional `options` passed to react-redux @connect
  options: {}
})
```

### Non-decorator API

You can use redux-ui without using an ES7 decorator like so:

```
import ui from 'redux-ui';
// or ui = require('redux-ui').default;

class SomeComponent extends Component {
}

SomeComponentWithUI = ui({ key: 'some-name', state: { ... }})(SomeComponent);
```

##### `key`: string or function, defaults to random characters

The name of the key used in the UI reducer under which we store all state.  Allows you to create selectors in reselect with known paths, and allows setting `persist` below.

It can also be a function that takes props as the first argument and will only generate the key when the component is mounted. For example:

```
@ui({
  key: (props) => (props.id),
  state: {
     uiVar1: ''
  }
})
class SomeComponent extends React.Component {
}

<SomeComponent id="sample-ui-key" />
```

If this is not specified it will be autogenerated based on the component name suffixed with a random hex code.  Components using the same key will share the same UI context, so don't supply a name to a list of components (generated in a loop) if they need their own UI state.


##### `persist`: bool, defaults to `false`

Set to true if the UI state for this component should persist after `componentWillUnmount`.  You must also explicitly define a `key` for this component, otherwise the component will randomize the key and load new UI state on instantiation.

**Note**: All parent UI components also need to set this to true for this to take effect. Think of block-level scoping again — if a parent scope quits all child scopes are also out of context.

##### `state`: object

All UI variables need to be explicitly defined in the state object.  This allows us to determine which scope a variable belongs to, as scope is inherited in the component tree.  Think of this as using `let` inside your block scopes.

### Examples

```js
import ui from 'redux-ui';

// Component A gets its own context with the default UI state below.
// `this.props.ui` will contain this state map.
@ui({
  state: {
    // use the filter query parma via redux-router as the default
    filter: (props, state) => state.router.location.query.filter,
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


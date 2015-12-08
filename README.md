# redux-ui makes UI state management easy

Store transient UI state in a global reducer which blows away automatically.

### Setup

1. Add the redux-ui reducer to your reducers **under the `ui` key**:
  `combineReducers({ ...yourReducers, ui: uiReducer })
2. In each 'scene' or parent component add the UI decorator with the key in
   which to save all state: `@ui('some-component')`
3. In each child component use the basic `@ui()` decorator; it will
   automatically read and write UI state to the parent component's UI key

### Usage:

The `@ui` decorator injects four props into your components:

1. `uiKey`: The key passed to the decorator from the decorator (eg.
   'some-decorator' with `@ui('some-decorator')`)`
2. `ui`: The UI state for the component's `uiKey`
3. `updateUI`: A function accepting either a name/value pair or object which
   updates state within `uiKey`
4. `resetUI`: A function which resets the state within `uiKey` to its default

### Examples

```js
import ui from 'redux-ui';

// This component reads and writes all UI data under the 'posts' key;
// so will all of its children decorated with no key (`@ui()`)
@ui('posts')
class Posts extends Component {

  static propTypes = {
    updateUI: PropTypes.func.isRequired,
    ui: PropTypes.object.isRequired
  }

  showForm() {
    // Update 'isFormVisible' within the posts key of global UI state.
    this.props.updateUI('isFormVisible', true);
  }

  render() {
    return (
      <div>
        <a href='#' onClick={ ::this.showForm }>Add new post</a>
        {/* We're rendering NewPostForm as a child which is decorated with no
            key. In this case it will also be bound to the 'posts' key */}
        <NewPostForm />
      </div>
    );
  }
}

@ui()
class NewPostForm extends Component {
  
  static propTypes = {
    updateUI: PropTypes.func.isRequired,
    ui: PropTypes.object.isRequired
  }

  render() {
    // Because this was rendered as a child and was decorated with no UI key it
    // will read from the first parent's UI key it finds.
    const { ui } = this.props;
    if ( ! ui.isFormVisible) {
      return;
    }
    return <p>...</p>;
  }
}
```

**Setting default state**

```js
@ui('smome-key', {
  defaultState: {
    whatever: 'you',
    want: true
  }
})
class SomeComponent extends Component {
  ...
}
```

<sup>(ignore that form hiding/showing should be done in the parent)</sup>

### Aims

UI state:

1. Should be global
2. Should be easily managed from each component via an action
3. Should be easy to reset (manually and when unmounting)

All of these goals should be easy to achieve.

---

MIT license.

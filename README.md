# redux-ui

UI state management for Redux. WIP until 1.0.0.

## Aims

UI state:

1. should be global
2. should be easily managed from each component via an action
3. should be automatically blown away upon navigation 

All of these goals should be easy to achieve.

## How?

A convoluted example of a page hiding a new post form via UI state across
multiple components:

```js
import ui from 'redux-ui';

@ui('posts')
class Posts extends Component {

  static propTypes = {
    updateUI: PropTypes.func.isRequired,
    ui: PropTypes.object.isRequired
  }

  showForm = (evt) => () {
    evt.preventDefault();
    this.props.updateUI('isFormVisible', true);
  }

  render() {
    return (
      <div>
        <a href='#' onClick={ ::this.showForm }>Add new post</a>
        <NewPostForm />
        <PostList />
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
    const { ui } = this.props;
    if ( ! ui.isFormVisible) {
      return;
    }

    return (
      <form>
        <p>some shit</p>
      </form>
    );
  }
}
```

(ignore that form hiding/showing should be done in the parent)

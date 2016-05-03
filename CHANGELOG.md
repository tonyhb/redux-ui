# v0.0.15
- Add: Allow `options` and `mergeProps` to be passed to `@connect()`
- Add: Expose `uiPath` in `this.props.uiPath`
- Fix state evaluation when parents call resetUI
- Fix state evaluation when child call resetUI

# v0.0.14
- Fix: update package.json for react 15

# v0.0.13
- republish of 0.0.12 due to npm error

# v0.0.12
- Add support for redux-immutable

# v0.0.11
- Change: Upgrade to babel 6
- Improve: Throw an error when custom reducers return no state

# v0.0.9
- Fix: issue where componentWillReceiveProps could break derived state from
  functions within opts.state

# v0.0.8
- Add: allow default state to be set from an evaulated function with the
  signature (props, state).

# v0.0.7
- Add: Custom per-component reducers for local UI state modification
- Fix: Fix react warnings from setting props in constructor

# v0.0.6
- Fix: no longer deeply convert UI defalts to immutableJS
- Change: Set default UI state in constructor
- Change: Delay wiping UI state on unmount in `requestAnimationFrame`

# v0.0.5
- Work around issue in `componentWillMount` in React. See commit
  `5f9ab5c44fc7941e6f78fa9470ab8a04b7487997` for more info.

# v0.0.4
- Fix invariant import in reducer

# v0.0.3
- Add transpiled source to package

# v0.0.2
- Fix dependencies

# v0.0.1
- Initial version with scoping of contexts from parent to child

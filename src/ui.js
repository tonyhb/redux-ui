'use strict';

import React, { Component, PropTypes } from 'react';
const { array, func, node, object, string } = PropTypes;
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import invariant from 'invariant';
import { updateUI, massUpdateUI, setDefaultUI } from './action-reducer';

const connector = connect(
  (state) => { return { ui: state.newUI }; },
  (dispatch) => bindActionCreators({ updateUI, massUpdateUI, setDefaultUI }, dispatch)
);

export default function ui(key, opts = {}) {
  if (typeof key === 'object') {
    opts = key;
    key = opts.key;
  }

  return (WrappedComponent) => {
    // If the key is undefined generate a new random hex key for the current
    // component's UI scope.
    if (key === undefined) {
      key = (WrappedComponent.constructor.displayName || 
             WrappedComponent.constructor.name) +
             Math.floor(Math.random() * (1 << 30)).toString(16);
    }

    // Return a parent UI class which scopes all UI state to the given key
    return connector(
      /**
       * UI is a wrapper component which:
       *   1. Inherits any parent scopes from parent components that are wrapped
       *      by @UI
       *   2. Sets up a new UI scope for the current component
       *   3. Merges the current UI scope into the parent UI scope (where the
       *      current scope takes precedence over parents)
       *
       * This allows normal block-scoping of UI state:
       *
       *   1. All UI components must define their local state keys
       *   2. Upon updating a state key, if it's not in the current scope
       *      walk up the tree until the variable is set
       *
       * This means that any child component can affect the current browser
       * chrome's UI state whilst maintaining their own local UI state.
       *
       * All state will be blown away on navigation by default.
       */
      class UI extends Component {

        static propTypes = {
          // The entire global UI state via react-redux connector
          ui: object.isRequired,
          // These actions are passed via react-redux connector
          setDefaultUI: func.isRequired,
          updateUI: func.isRequired,
          massUpdateUI: func.isRequired
        }

        // Pass these down in the new context created for this component
        static childContextTypes = {
          // uiKey is the name of the parent context's key
          uiKey: string,
          // uiPath is the current path of the UI context
          uiPath: array,
          // uiVars is a map of UI variable names stored in state to the parent
          // context which controls them.
          uiVars: object,

          // Actions to pass to children
          updateUI: func,
          resetUI: func
        }

        // Get the existing context from a UI parent, if possible
        static contextTypes = {
          uiKey: string,
          uiPath: array,
          uiVars: object,

          updateUI: func,
          resetUI: func
        }

        // When the component mounts merge the parent context variables with the
        // current context.
        componentWillMount() {
          // Ensure we have this.uiVars set up for local context's UI state
          this.getMergedContextVars();

          // If the component's UI subtree doesn't exist and we have state to
          // set ensure we update our global store with the current state.
          if (this.props.ui.getIn(this.uiPath) === undefined && opts.state)  {
            this.props.setDefaultUI(this.uiPath, opts.state);
          }
        }

        // When a parent context calls resetUI it blows away the entire subtree
        // that any child contexts may store state in.
        //
        // We may need to restore default props for this component if a parent
        // has blown away our state.
        componentWillReceiveProps(nextProps) {
          if (nextProps.ui.getIn(this.uiPath) === undefined && opts.state) {
            this.props.setDefaultUI(this.uiPath, opts.state);
          }
        }

        // Blow away all UI state for this component key by setting the
        // state for this key to undefined. This will get reset to the
        // default state in componentWillMount in the future.
        componentWillUnmount() {
          this.props.setDefaultUI(this.uiPath);
        }

        // Sets this.uiVars && this.uiPath.
        //
        // Merges this UI context's variables with any parent context's
        // variables defined in uiVars.
        getMergedContextVars() {
          if (!this.uiVars || !this.uiPath) {
            const uiPath = this.context.uiPath || [];
            this.uiPath = uiPath.concat(key);

            // Keep trackof each UI variable and which path it should be set in
            const state = opts.state || {};
            this.uiVars = this.context.uiVars || {};
            Object.keys(state).forEach(k => this.uiVars[k] = this.uiPath, this);
          }

          return [this.uiVars, this.uiPath];
        }

        // Construct a new context for all child UI components. We need to merge
        // in the vars defined in opts.state to uiVars to explicitly state that
        // this context is in charge of those variables.
        //
        // Pass the uiKey and partially applied updateUI function to all
        // child components that are wrapped in a plain `@ui()` decorator
        getChildContext() {
          let [uiVars, uiPath] = this.getMergedContextVars();

          return {
            uiKey: key,
            uiVars,
            uiPath,

            updateUI: ::this.updateUI,
            resetUI: ::this.resetUI
          };
        }

        // Helper function to reset UI for the current context **and all child
        // scopes**.
        //
        // This is the same as exiting scope in programming; all variables
        // defined within the scope are reset.
        resetUI() {
          this.props.setDefaultUI(this.uiPath, opts.state);
          // TODO: Wipe all child contexts
        }

        updateUI(name, value) {
          // Get a list of all UI variables available to this context (which
          // lists parent contexts) to see which key we need to set this in.
          const [uiVars] = this.getMergedContextVars();
          const key = uiVars[name];

          if (typeof name === 'object' && value === undefined) {
            // We're mass updating many UI variables. These may or may not be
            // directly controlled by our context, so we delegate to the
            // reducer which will deeply set each variable according to its
            // uiPath (from uiVars).
            //
            // Doing this means we only trigger one store update.
            this.props.massUpdateUI(this.uiVars, name);
            return
          }

          invariant(
            key,
            `The '${name}' UI variable is not defined in the UI context in "` +
            (WrappedComponent.displayName || WrappedComponent.name) + '" ' +
            'or any parent UI context. Set this variable using the "state" ' +
            'option in the @ui decorator before using it.'
          );

          this.props.updateUI(key, name, value);
        }

        // Iterate through the list of contexts merging in UI variables from the
        // UI store
        mergeUIProps() {
          return Object.keys(this.uiVars).reduce((props, k) => {
            props[k] = this.props.ui.getIn(this.uiVars[k].concat(k));
            return props;
          }, {}) || {};
        }

        render() {

          return (
            <WrappedComponent
              { ...this.props }
              uiKey={ key }
              ui={ this.mergeUIProps() }
              resetUI={ ::this.resetUI }
              updateUI={ ::this.updateUI } />
          );
        }
      }
    );

    /*
    // This is a child @ui component which updates all UI state within
    // a parent's @ui scope
    return connector(
      class UIChild extends Component {
        static propTypes = {
          ui: object.isRequired
        }

        componentWillMount() {
          invariant(
            this.context.updateUI,
            'Cannot find this.context.updateUI in "' +
            (WrappedComponent.displayName || WrappedComponent.name) + '". ' +
            'Set a UI key on this or one of its parents.'
          );
        }

        render() {
          const { component } = this.props;
          const { uiKey, updateUI, resetUI } = this.context;
          return (
            <WrappedComponent
              uiKey={ uiKey }
              ui={ this.props.ui[key] || {} }
              resetUI={ resetUI }
              updateUI={ updateUI } />
          );
        }

      }
    );
   */

  }
}

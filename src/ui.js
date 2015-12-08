'use strict';

import React, { Component, PropTypes } from 'react';
const { func, node, object, string } = PropTypes;
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import invariant from 'invariant';
import { updateUI, setDefaultUI } from './action-reducer';

// this connector 
const connector = connect(
  (state) => { return { ui: state.ui }; },
  (dispatch) => bindActionCreators({ updateUI, setDefaultUI }, dispatch)
);

const partiallyApplyUpdateUI = (updateUI, k) => {
  return (n, v) => updateUI(k, n, v);
}

export default function ui(key, opts = {}) {
  return (WrappedComponent) => {
    if (key !== undefined) {
      // Return a parent UI class which scopes all UI state to the given key
      return connector(
        class UIParent extends Component {

          static propTypes = {
            // These are passed via react-redux connector
            setDefaultUI: func.isRequired,
            updateUI: func.isRequired,
            ui: object.isRequired
          }

          static childContextTypes = {
            uiKey: string,
            updateUI: func,
            resetUI: func
          }

          componentWillMount() {
            if (this.props.ui[key] === undefined && opts.defaultState)  {
              this.props.setDefaultUI(key, opts.defaultState);
            }
          }

          componentWillUnmount() {
            // Blow away all UI state for this component key by setting the
            // state for this key to undefined. This will get reset to the
            // default state in componentWillMount in the future.
            this.props.setDefaultUI(key);
          }

          // Pass the uiKey and partially applied updateUI function to all
          // child components that are wrapped in a plain `@ui()` decorator
          getChildContext() {
            return {
              uiKey: key,
              updateUI: partiallyApplyUpdateUI(this.props.updateUI, key),
              resetUI: ::this.resetUI
            };
          }

          resetUI() {
            this.props.setDefaultUI(key, opts.defaultState);
          }

          render() {
            return (
              <WrappedComponent
                uiKey={ key }
                ui={ this.props.ui[key] || {} }
                resetUI={ ::this.resetUI }
                updateUI={ partiallyApplyUpdateUI(this.props.updateUI, key) } />
            );
          }
        }
      );
    }

    // This is a child @ui component which updates all UI state within
    // a parent's @ui scope
    return connector(
      class UIChild extends Component {
        static propTypes = {
          ui: object.isRequired
        }

        static contextTypes = {
          uiKey: string,
          updateUI: func.isRequired,
          resetUI: func.isRequired
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

  }
}

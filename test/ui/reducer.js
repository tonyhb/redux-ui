'use strict';

import { assert } from 'chai'; 

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { is, Map } from 'immutable';
import TestUtils from 'react-addons-test-utils';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';

import ui, { reducer } from '../../src';
import { store, render, renderAndFind } from '../utils/render.js';

describe('with a custom reducer', () => {

  class Parent extends Component {
    render = () => <div>{ this.props.children }</div>
  }

  // Create a UI component that listens to the 'CUSTOM' type and updates
  // UI variables
  let parentReducer = (state, action) => {
    if (action.type === 'CUSTOM') {
      return state.set('name', 'parentOverride');
    }
    return state;
  };
  const UIParent = ui({
    key: 'parent',
    state: {
      name: 'parent'
    },
    reducer: parentReducer
  })(Parent);

  it('adds a custom reducer on mount and removes at unmount', () => {
    const c = renderAndFind(<UIParent />, Parent);

    let reducers = store.getState().ui.get('__reducers');
    assert.equal(reducers.size, 1);
    assert.equal(reducers.get('parent').func, parentReducer);

    // Unmount and this should be gone
    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(c).parentNode);
    reducers = store.getState().ui.get('__reducers');
    assert.equal(reducers.size, 0);
  });

  it('updates props as expected', () => {
    const c = renderAndFind(<UIParent />, Parent);
    assert.equal(c.props.ui.name, 'parent');
    c.props.updateUI('name', 'foo');
    assert.equal(c.props.ui.name, 'foo');

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(c).parentNode);
  });

  it('responds to actions using a custom reducer', () => {
    const c = renderAndFind(<UIParent />, Parent);
    store.dispatch({ type: 'CUSTOM' });
    assert.equal(c.props.ui.name, 'parentOverride');

    ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(c).parentNode);
  });

  describe('with children', () => {
    // This will be set when the reducer is called, allowing us to test what
    // state the reducer is given.
    //
    // We should only be given state for our current component.
    let reducerState;

    // Create a UI component that listens to the 'CUSTOM' type and updates
    // UI variables
    let childReducer = (state = {}, action) => {
      reducerState = state;
      if (action.type === 'CUSTOM') {
        return state.set('foo', 'childOverride');
      }
      return state;
    };
    class Child extends Component {
      render = () => <p>child</p>
    }
    const UIChild = ui({
      key: 'child',
      state: { foo: 'bar' },
      reducer: childReducer
    })(Child);

    it('only gets given the UI state for the current component', () => {
      const tree = render(<UIParent><UIChild /></UIParent>, Parent);
      const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
      const child = TestUtils.findRenderedComponentWithType(tree, Child);

      store.dispatch({ type: 'CUSTOM' });
      // The reducerState should equal the default reducer state for our child
      // component
      assert.isTrue(is(reducerState, new Map({ foo: 'bar' })));
      assert.equal(parent.props.ui.name, 'parentOverride');
      assert.equal(child.props.ui.foo, 'childOverride');

      ReactDOM.unmountComponentAtNode(ReactDOM.findDOMNode(parent).parentNode);
    });
  });

});

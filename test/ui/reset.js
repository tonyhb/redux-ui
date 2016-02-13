'use strict';

import { assert } from 'chai';
import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';

import ui, { reducer } from '../../src';
import { render, renderAndFind, setCombineReducers } from '../utils/render.js';

['reduxCombineReducers', 'immutableCombineReducers'].forEach((cr) => {
  describe('resetting UI state', () => {
    before(() => setCombineReducers(cr));

    class Parent extends Component {
      render = () => (<div>{ this.props.children }</div>)
    }

    class Child extends Component {
      render = () => <p>Child</p>
    }

    const UIParent = ui({ state: { name: 'parent' } })(Parent);
    const UIChild = ui({ state: { name: 'child' } })(Child);

    it('resetting a UI component with no children resets its own UI state', () => {
      const child = renderAndFind(<UIChild />, Child);

      child.props.updateUI({ name: 'foobar' });
      assert(child.props.ui.name === 'foobar');
      child.props.resetUI();
      assert(child.props.ui.name === 'child');
    });

    it('resetting a parent UI resets its own AND child contexts', () => {
        const tree = render(<UIParent><UIChild /></UIParent>);
        const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
        const child = TestUtils.findRenderedComponentWithType(tree, Child);

        child.props.updateUI({ name: 'b' });
        parent.props.updateUI({ name: 'a' });
        // Ensure state is updated
        assert(child.props.ui.name === 'b');
        // Resetting a parent should also reset all children
        parent.props.resetUI();
        assert(child.props.ui.name === 'child');
        assert(parent.props.ui.name === 'parent');
    });

    it('resetting a child UI resets only its own context', () => {
        const tree = render(<UIParent><UIChild /></UIParent>);
        const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
        const child = TestUtils.findRenderedComponentWithType(tree, Child);

        child.props.updateUI({ name: 'b' });
        parent.props.updateUI({ name: 'a' });
        // Ensure state is updated
        assert(child.props.ui.name === 'b');
        // Child should only reset itself to child; parent should stay changed
        child.props.resetUI();
        assert(child.props.ui.name === 'child');
        assert(parent.props.ui.name === 'a');
    });
  });
});

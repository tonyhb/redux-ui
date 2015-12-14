'use strict';

import { assert } from 'chai'; 
import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';

import ui, { reducer } from '../../src';
import { render, renderAndFind } from '../utils/render.js';

describe('UI state context', () => {

  describe('single component tree', () => {
    class Test extends Component {
      updateName() { this.props.updateUI('name', 'test'); }
      massUpdate() {
        this.props.updateUI({
          name: 'test',
          isValid: false
        });
      }
      render() { return <p>Hi</p>; }
    }
    const uiState = {
      name: 'foo',
      isValid: true
    };
    const WrappedTest = ui({ state: uiState })(Test);
 
    it('component gets given expected props', () => {
      const c = renderAndFind(<WrappedTest />, Test);
      assert(typeof c.props.updateUI === 'function', 'has updateUI');
      assert(typeof c.props.resetUI === 'function', 'has resetUI');
      assert(typeof c.props.uiKey === 'string', 'has uiKey');
      assert(shallowEqual(c.props.ui, uiState), 'has default state');
    });

    it('updates props using the single-update syntax', () => {
      const c = renderAndFind(<WrappedTest />, Test);
      assert(c.props.ui.name === 'foo');
      c.updateName()
      assert(c.props.ui.name === 'test');
    });

    it('updates props using the mass-update syntax', () => {
      const c = renderAndFind(<WrappedTest />, Test);
      assert(c.props.ui.name === 'foo');
      c.massUpdate()
      assert(c.props.ui.name === 'test');
      assert(c.props.ui.isValid === false);
    });
  });

  describe('single nested ui component tree', () => {
    const uiState = {
      name: 'foo'
    };

    class Parent extends Component { render() { return <WrappedChild />; } };
    const WrappedParent = ui({state: uiState})(Parent);
    class Child extends Component {
      updateName() { this.props.updateUI('name', 'bar'); }
      render() { return <p>Nested</p>; }
    };
    const WrappedChild = ui({})(Child);

    it('child component inherits parent context', () => {
      const c = renderAndFind(<WrappedParent />, Child);
      assert(shallowEqual(c.props.ui, uiState), 'child inherits parent UI state context');
    });

    it('child component updates parent variables', () => {
      const tree = render(<WrappedParent />);
      const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
      const child = TestUtils.findRenderedComponentWithType(tree, Child);

      assert(parent.props.ui.name === 'foo');
      assert(child.props.ui.name === 'foo');
      child.updateName();
      assert(parent.props.ui.name === 'bar');
      assert(child.props.ui.name === 'bar');
    });
  });

});

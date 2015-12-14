'use strict';

import { assert } from 'chai'; 
import React, { Component } from 'react';
import TestUtils from 'react-addons-test-utils';
import shallowEqual from 'react-redux/lib/utils/shallowEqual';

import ui, { reducer } from '../../src';
import { wrapWithProvider } from '../utils/render.js';

describe('UI state context', () => {

  describe('single component tree', () => {

    class Test extends Component { render() { return <p>Hi</p>; } }
    const uiState = {
      string: 'foo',
      isValid: true
    };
    const WrappedTest = ui({ state: uiState })(Test);

    it('component gets given expected props', () => {
      const tree = TestUtils.renderIntoDocument(
        wrapWithProvider(<WrappedTest />)
      );
      const c = TestUtils.findRenderedComponentWithType(tree, Test);
      assert(typeof c.props.updateUI === 'function', 'has updateUI');
      assert(typeof c.props.resetUI === 'function', 'has resetUI');
      assert(typeof c.props.uiKey === 'string', 'has uiKey');
      assert(shallowEqual(c.props.ui, uiState), 'has default state');
    });

  });

});

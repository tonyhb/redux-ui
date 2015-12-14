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
      name: 'parent',
      isValid: true
    };
    const UITest = ui({ state: uiState })(Test);
 
    it('component gets given expected props', () => {
      const c = renderAndFind(<UITest />, Test);
      assert(typeof c.props.updateUI === 'function', 'has updateUI');
      assert(typeof c.props.resetUI === 'function', 'has resetUI');
      assert(typeof c.props.uiKey === 'string', 'has uiKey');
      assert(shallowEqual(c.props.ui, uiState), 'has default state');
    });

    it('updates props using the single-update syntax', () => {
      const c = renderAndFind(<UITest />, Test);
      assert(c.props.ui.name === 'parent');
      c.updateName()
      assert(c.props.ui.name === 'test');
    });

    it('updates props using the mass-update syntax', () => {
      const c = renderAndFind(<UITest />, Test);
      assert(c.props.ui.name === 'parent');
      c.massUpdate()
      assert(c.props.ui.name === 'test');
      assert(c.props.ui.isValid === false);
    });
  });

  describe('single-level nested ui component tree', () => {
    const uiState = {
      name: 'parent'
    };
    class Parent extends Component {
      updateContext(to = 'parent') { this.props.updateUI('name', to); }
      render() { return <div>{ this.props.children }</div>; }
    };
    const UIParent = ui({state: uiState})(Parent);

    class Child extends Component {
      updateParentContext(to = 'parent') { this.props.updateUI('name', to); }
      updateName() { this.props.updateUI('name', 'bar'); }
      updateOwnState() { this.props.updateUI('child', 'foo'); }
      render() { return <p>Nested</p>; }
    };
    const UIChild = ui({})(Child);
    const UIChildWithOwnState = ui({ state: { child: true } })(Child);
    const UIChildWithOwnStateJSX = (
      <UIParent>
        <UIChildWithOwnState />
      </UIParent>
    );

    it('child component inherits parent context', () => {
      const c = renderAndFind(<UIParent><UIChild /></UIParent>, Child);
      assert(shallowEqual(c.props.ui, uiState), 'child inherits parent UI state context');
    });

    it('parent component only gets its own context', () => {
      const p = renderAndFind(UIChildWithOwnStateJSX, Parent);
      assert(shallowEqual(p.props.ui, uiState), 'parent only has its own context and not childrens');
    });

    it('child component updates parent variables', () => {
      const tree = render(<UIParent><UIChild /></UIParent>);
      const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
      const child = TestUtils.findRenderedComponentWithType(tree, Child);

      assert(parent.props.ui.name === 'parent');
      assert(child.props.ui.name === 'parent');
      child.updateName();
      assert(parent.props.ui.name === 'bar');
      assert(child.props.ui.name === 'bar');
    });

    it('child merges parent UI context with its own UI context', () => {
      const child = renderAndFind(UIChildWithOwnStateJSX, Child);
      const expectedState = {
        name: 'parent',
        child: true
      };
      assert(shallowEqual(child.props.ui, expectedState), 'child merges context');
    });

    it('child updates own context separately from parent', () => {
      const tree = render(UIChildWithOwnStateJSX);
      const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
      const child = TestUtils.findRenderedComponentWithType(tree, Child);
      child.updateOwnState();
      assert(child.props.ui.child === 'foo', 'child updates own context');
      assert(parent.props.ui.child === undefined, 'parent has no child state in its context');
    });

    it('child updates parent context', () => {
      const tree = render(UIChildWithOwnStateJSX);
      const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
      const child = TestUtils.findRenderedComponentWithType(tree, Child);

      child.updateParentContext('foobar');
      assert(parent.props.ui.name === 'foobar', 'parent updates context');
      assert(child.props.ui.name === 'foobar', 'child updates context');
    });

    it('parent updating context sends child new context and child receives updates', () => {
      const tree = render(UIChildWithOwnStateJSX);
      const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
      const child = TestUtils.findRenderedComponentWithType(tree, Child);

      parent.updateContext('what');
      assert(parent.props.ui.name === 'what', 'parent updates context');
      assert(child.props.ui.name === 'what', 'child updates context');
    });

    describe('duplicating UI variable names across parent/child contexts', () => {
      class Child extends Component {
        updateChildContext(to = 'foo') { this.props.updateUI('name', to); }
        render() { return <div /> }
      }
      const UIChild = ui({ state: { name: 'child' } })(Child);
      const UIChildJSX = (<UIParent><UIChild /></UIParent>);

      it('parent and child store state separately', () => {
        const tree = render(UIChildJSX);
        const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
        const child = TestUtils.findRenderedComponentWithType(tree, Child);

        assert(parent.props.ui.name === 'parent');
        assert(child.props.ui.name === 'child');
      }); 

      it('parent updates context separately from parent', () => {
        const tree = render(UIChildJSX);
        const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
        const child = TestUtils.findRenderedComponentWithType(tree, Child);

        parent.updateContext('foobar');
        assert(parent.props.ui.name === 'foobar');
        assert(child.props.ui.name === 'child');
      }); 


      it('child updates context separately from parent', () => {
        const tree = render(UIChildJSX);
        const parent = TestUtils.findRenderedComponentWithType(tree, Parent);
        const child = TestUtils.findRenderedComponentWithType(tree, Child);

        child.updateChildContext('foobar');
        assert(parent.props.ui.name === 'parent');
        assert(child.props.ui.name === 'foobar');
      }); 
    });

  });

  describe('shared contexts', () => {
    class Foo extends Component {
      updateContext(to = 'misc') { this.props.updateUI('name', to); }
      render = () => <div />
    }
    class Bar extends Component {
      updateContext(to = 'misc') { this.props.updateUI('name', to); }
      render = () => <div />
    }
    const adapter = ui({ key: 'a', state: { name: 'name' } });
    const UIFoo = adapter(Foo);
    const UIBar = adapter(Bar);

    it('components with the same key and nesting share the same context', () => {
        const tree = render(<div><UIFoo /><UIBar /></div>);
        const a = TestUtils.findRenderedComponentWithType(tree, Foo);
        const b = TestUtils.findRenderedComponentWithType(tree, Bar);

        assert(shallowEqual(a.props.ui, b.props.ui));
        a.updateContext();
        assert(a.props.ui.name === 'misc');
        assert(shallowEqual(a.props.ui, b.props.ui));
    });

  });

});

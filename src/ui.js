'use strict'

import React, { Component } from 'react'
import { any, array, func, node, object, string } from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import invariant from 'invariant'
import shallowCompare from 'react-pure-render/shallowEqual'
import { updateUI, massUpdateUI, setDefaultUI, mountUI, unmountUI } from './action-reducer'
import { ReduxUIStoreContext } from "./ReduxUIStoreContext"

import { getUIState } from './utils'

export default function ui(key, opts = {}) {
    if (typeof key === 'object') {
        opts = key
        key = opts.key
    }

    const connector = connect(
        (state) => {
            return { ui: getUIState(state) }
        },
        (dispatch) => bindActionCreators({
            updateUI,
            massUpdateUI,
            setDefaultUI,
            mountUI,
            unmountUI
        }, dispatch),
        // These allow you to pass 'mergeProps' and 'options' keys into the
        // UI decorator's options which will be passed to @connect().
        // TODO: Document
        opts.mergeProps,
        opts.options
    )

    return (WrappedComponent) => {

        // Return a parent UI class which scopes all UI state to the given key
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

            constructor(props, ctx, queue) {
                super(props, ctx, queue)

                this.resetUI = this.resetUI.bind(this)
                this.updateUI = this.updateUI.bind(this)

                // If the key is undefined generate a new random hex key for the
                // current component's UI scope.
                //
                // We do this in construct() to guarantee a new key at component
                // instantiation time wihch is needed for iterating through a list of
                // components with no explicit key
                if (key === undefined) {
                    this.key = (WrappedComponent.displayName ||
                        WrappedComponent.name) +
                        Math.floor(Math.random() * (1 << 30)).toString(16)
                } else {
                    this.key = key
                }

                // Immediately set this.uiPath and this.uiVars based on the incoming
                // context in class instantiation
                this.getMergedContextVars(this.context)
            }

            static propTypes = {
                // The entire global UI state via react-redux connector
                ui: object.isRequired,
                // These actions are passed via react-redux connector
                setDefaultUI: func.isRequired,
                updateUI: func.isRequired,
                massUpdateUI: func.isRequired
            }

            // Pass these down in the new context created for this component
            // static childContextTypes = {
            //     // uiKey is the name of the parent context's key
            //     uiKey: string,
            //     // uiPath is the current path of the UI context
            //     uiPath: array,
            //     // uiVars is a map of UI variable names stored in state to the parent
            //     // context which controls them.
            //     uiVars: object,
            //
            //     // Actions to pass to children
            //     updateUI: func,
            //     resetUI: func
            // }
            //
            // // Get the existing context from a UI parent, if possible
            // static contextTypes = {
            //     // This is used in mergeUIProps and construct() to immediately set
            //     // props.
            //
            //     uiKey: string,
            //     uiPath: array,
            //     uiVars: object,
            //
            //     updateUI: func,
            //     resetUI: func
            // }

            componentWillMount() {
                // If the component's UI subtree doesn't exist and we have state to
                // set ensure we update our global store with the current state.
                if (this.props.ui.getIn(this.uiPath) === undefined && opts.state) {
                    const state = this.getDefaultUIState(opts.state)
                    this.context.store.dispatch(mountUI(this.uiPath, state, opts.reducer))
                }
            }

            // When a parent context calls resetUI it blows away the entire subtree
            // that any child contexts may store state in.
            //
            // We may need to restore default props for this component if a parent
            // has blown away our state.
            componentWillReceiveProps(nextProps) {
                // We can only see if this component's state is blown away by
                // accessing the current global UI state; the parent will not
                // necessarily always pass down child state.
                const ui = getUIState(this.context.store.getState())
                if (ui.getIn(this.uiPath) === undefined && opts.state) {
                    const state = this.getDefaultUIState(opts.state, nextProps)
                    this.props.setDefaultUI(this.uiPath, state)
                }
            }

            // Get default state by evaluating any functions passed in to the state
            // opts.
            // This is also used within componentWilLReceiveProps and so props
            // also needs to be passed in
            getDefaultUIState(uiState, props = this.props) {
                const globalState = this.context.store.getState()
                let state = { ...uiState }
                Object.keys(state).forEach(k => {
                    if (typeof(state[k]) === 'function') {
                        state[k] = state[k](this.props, globalState)
                    }
                })
                return state
            }

            // Blow away all UI state for this component key by setting the
            // state for this key to undefined. This will get reset to the
            // default state in componentWillMount in the future.
            //
            // We use requestAnimationFrame because `@ui()` can be combined with
            // with `@connect()`; if the connect decorator uses selectors based on
            // UI state (such as live filtering) the connect decorator will receive
            // `undefined` as `this.props.ui` before unmounting.
            //
            // requestAnimationFrame avoids this.
            componentWillUnmount() {
                if (opts.persist !== true) {
                    if (window && window.requestAnimationFrame) {
                        window.requestAnimationFrame(() => this.props.unmountUI(this.uiPath))
                    } else {
                        this.props.unmountUI(this.uiPath)
                    }
                }
            }

            // Sets this.uiVars && this.uiPath.
            //
            // Merges this UI context's variables with any parent context's
            // variables defined in uiVars.
            getMergedContextVars(ctx = this.context) {
                if (!this.uiVars || !this.uiPath) {
                    const uiPath = ctx.uiPath || []
                    this.uiPath = uiPath.concat(this.key)

                    // Keep trackof each UI variable and which path it should be set in
                    const state = opts.state || {}
                    this.uiVars = { ...ctx.uiVars } || {}
                    Object.keys(state).forEach(k => this.uiVars[k] = this.uiPath, this)
                }

                return [this.uiVars, this.uiPath]
            }

            // Construct a new context for all child UI components. We need to merge
            // in the vars defined in opts.state to uiVars to explicitly state that
            // this context is in charge of those variables.
            //
            // Pass the uiKey and partially applied updateUI function to all
            // child components that are wrapped in a plain `@ui()` decorator
            getContextForChild() {
                let [uiVars, uiPath] = this.getMergedContextVars()

                return {
                    store: this.context.store,
                    uiKey: this.key,
                    uiVars,
                    uiPath,

                    updateUI: this.updateUI,
                    resetUI: this.resetUI
                }
            }

            // Helper function to reset UI for the current context **and all child
            // scopes**.
            //
            // This is the same as exiting scope in programming; all variables
            // defined within the scope are reset.
            resetUI() {
                this.props.setDefaultUI(this.uiPath, this.getDefaultUIState(opts.state))
                // TODO: Wipe all child contexts
            }

            updateUI(name, value) {
                // Get a list of all UI variables available to this context (which
                // lists parent contexts) to see which key we need to set this in.
                const [uiVars] = this.getMergedContextVars()
                const uiVarPath = uiVars[name]

                if (typeof name === 'object' && value === undefined) {
                    // We're mass updating many UI variables. These may or may not be
                    // directly controlled by our context, so we delegate to the
                    // reducer which will deeply set each variable according to its
                    // uiPath (from uiVars).
                    //
                    // Doing this means we only trigger one store update.
                    this.props.massUpdateUI(this.uiVars, name)
                    return
                }

                invariant(
                    uiVarPath,
                    `The '${name}' UI variable is not defined in the UI context in "` +
                    (WrappedComponent.displayName || WrappedComponent.name) + '" ' +
                    'or any parent UI context. Set this variable using the "state" ' +
                    'option in the @ui decorator before using it.'
                )

                this.props.updateUI(uiVarPath, name, value)
            }

            // Iterate through the list of contexts merging in UI variables from the
            // UI store
            mergeUIProps() {
                // WARNING: React has a subtle componentWillMount bug which we're
                // working around here!
                //
                // ## React bug
                //
                // On the first *ever* render of this component we set defaults in
                // componentWillMount. This works; when `render()` is called the
                // wrapped component has the default props within this.props.ui
                //
                // BUT.  Unmount, navigate away then return to this component.  When
                // componentWillMount is called a *second* time, we call updateUI to
                // set default props. **These aren't passed in to render() until the
                // component is mounted a second time**. Even though it worked first
                // time. And even though this is a new instance of the component.
                //
                // ## Workaround.
                //
                // Instead of relying on this.props.ui from our connector we call
                // getState() in the store directly here. We guarantee that this will
                // be the latest set of props, including default props set in
                // componentWillMount.
                //
                // We still use @connect() to connect to the store and listen for
                // changes in other cases.
                const ui = getUIState(this.context.store.getState())

                const result = Object.keys(this.uiVars).reduce((props, k) => {
                    props[k] = ui.getIn(this.uiVars[k].concat(k))
                    return props
                }, {}) || {}

                // If this slice of the UI has not changed (shallow comparison),
                // then use an old copy of the slice to prevent unnecessary
                // re-rendering
                if (!shallowCompare(this.__previousMergeResult, result)) {
                    this.__previousMergeResult = result
                }
                return this.__previousMergeResult
            }

            render() {
                return (
                    <ReduxUIStoreContext.Provider value={this.getContextForChild()}>
                        <WrappedComponent
                            {...this.props}
                            uiKey={this.key}
                            uiPath={this.uiPath}
                            ui={this.mergeUIProps()}
                            resetUI={this.resetUI}
                            updateUI={this.updateUI}/>
                    </ReduxUIStoreContext.Provider>
                )
            }
        }

        UI.contextType = ReduxUIStoreContext

        return connector(UI)
    }
}

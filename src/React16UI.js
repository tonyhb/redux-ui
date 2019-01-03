import React, { PureComponent } from "react"
import { connect } from "react-redux"
import { ReactReduxContext } from 'react-redux'

export function React16UI() {
    return (WrappedComponent) => {
        @connect()
        class React16UIWrapper extends PureComponent {

            render() {
                return <ReactReduxContext.Consumer>
                    {({ store }) => {
                        <WrappedComponent store={store}
                                          {...this.props} />
                    }}

                </ReactReduxContext.Consumer>
            }
        }

        return React16UIWrapper
    }
}
import React, { Component, ReactNode } from 'react'

interface Props {
    children: ReactNode
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
    hasError: boolean
    error?: Error
}

export class TestErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        if (this.props.onError) {
            this.props.onError(error, errorInfo)
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div data-testid="error-boundary">
                    <h2>Something went wrong</h2>
                    <p>{this.state.error?.message}</p>
                </div>
            )
        }

        return this.props.children
    }
}
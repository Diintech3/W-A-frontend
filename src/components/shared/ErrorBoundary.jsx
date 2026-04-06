import { Component } from 'react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-6">
          <div className="max-w-lg rounded-xl border border-[#334155] bg-[#1E293B] p-8 text-center">
            <h1 className="text-xl font-semibold text-[#F1F5F9] mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-[#0F172A]"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

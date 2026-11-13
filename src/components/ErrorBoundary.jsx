import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error) {
    console.error(error)
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-md py-16 text-center">
        <p className="font-bold text-danger">{this.props.message || 'Algo deu errado ao exibir esta página.'}</p>
        <button type="button" className="btn btn-ghost mt-4" onClick={() => this.setState({ failed: false })}>
          Tentar de novo
        </button>
      </div>
    )
  }
}

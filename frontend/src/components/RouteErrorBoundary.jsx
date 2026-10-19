import { Component } from "react";

export default class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="route-fallback route-fallback--error">
        <p className="route-fallback__msg">Could not load this page.</p>
        <button
          type="button"
          className="route-fallback__reload"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    );
  }
}

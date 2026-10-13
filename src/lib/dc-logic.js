// Minimal base class matching the Claude Design runtime: state merges synchronously.
export class DCLogic {
  constructor(props) {
    this.props = props || {};
    this.state = {};
  }
  setState(patch) {
    Object.assign(this.state, patch);
  }
}

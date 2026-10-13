// Generated from O2-Event.dc.html.
/* eslint-disable @typescript-eslint/no-this-alias -- ported canvas logic keeps its `var self = this` closures */
import { DCLogic } from "@/lib/dc-logic";

export class Component extends DCLogic {
  constructor(props) { super(props); this.state = { picked: 0 }; }
  renderVals() {
    var self = this;
    var labels = ['A renewal', 'Planned treatment', 'A job change', 'Parents’ cover', 'Nothing yet, just getting organised'];
    var base = 'width:100%;min-height:56px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:10px;font:inherit;font-size:17px;text-align:left;cursor:pointer;';
    return {
      options: labels.map(function (label, i) {
        var sel = self.state.picked === i;
        return {
          label: label, selected: sel, on: sel ? 'true' : 'false',
          style: base + (sel ? 'background:#E3F0EE;border:2px solid #176F69;color:#163F42;font-weight:600;' : 'background:#FFFFFF;border:1px solid #7B918E;color:#1A3034;'),
          pick: function () { self.setState({ picked: i }); }
        };
      })
    };
  }
}

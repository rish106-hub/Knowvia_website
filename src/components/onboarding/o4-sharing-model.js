// Generated from O4-Sharing.dc.html.
/* eslint-disable @typescript-eslint/no-this-alias -- ported canvas logic keeps its `var self = this` closures */
import { DCLogic } from "@/lib/dc-logic";

export class Component extends DCLogic {
  constructor(props) { super(props); this.state = { on: false }; }
  renderVals() {
    var self = this;
    var on = this.state.on;
    return {
      onStr: on ? 'true' : 'false',
      trackStyle: 'position:relative;display:block;width:52px;height:32px;box-sizing:border-box;border-radius:999px;transition:background-color 180ms ease-out;' + (on ? 'background:#176F69;border:1px solid #176F69;' : 'background:#E6EFEC;border:1.5px solid #55696D;'),
      knobStyle: 'position:absolute;top:3px;width:24px;height:24px;border-radius:50%;box-shadow:0 1px 3px rgba(22,62,54,0.3);transition:left 240ms cubic-bezier(0.165,0.84,0.44,1);' + (on ? 'left:24px;background:#FFFFFF;' : 'left:3px;background:#55696D;')
    , toggle: function () { self.setState({ on: !on }); }
    };
  }
}

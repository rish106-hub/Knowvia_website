// Which sign-in methods the sign-in screen may show, from the connectors list (GET /api/app/connectors). Pure, unit tested.
// Nothing is offered while the list is loading or has failed: the development form must never flash up on a real deployment.
import type { ConnectorList } from "@/lib/app-contract";

export type SignInOptions =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; google: boolean; dev: boolean };

type ConnectorsLike = { status: "loading" } | { status: "error" } | { status: "ready"; data: Pick<ConnectorList, "signIn"> };

export function signInOptions(connectors: ConnectorsLike): SignInOptions {
  if (connectors.status !== "ready") return { status: connectors.status };
  return { status: "ready", google: connectors.data.signIn?.google === true, dev: connectors.data.signIn?.dev === true };
}

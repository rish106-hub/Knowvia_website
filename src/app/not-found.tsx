import Link from "next/link";
import { DesignShell } from "@/components/layout/DesignShell";
export default function NotFound() { return <DesignShell><main className="not-found"><span>404</span><h1>This page is not in the policy.</h1><p>The link may be old, or the page may have moved.</p><Link className="button" href="/">Go to Knowvia</Link></main></DesignShell>; }

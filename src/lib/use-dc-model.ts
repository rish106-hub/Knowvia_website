"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { Any } from "./dc";

/** Runs an artboard's logic class (constructor, componentDidMount, renderVals) inside React. */
export function useDcModel(Model: Any, props: Any) {
  const [store] = useState(() => {
    const listeners = new Set<() => void>();
    let version = 0;
    const model = new Model(props);
    model.setState = (patch: Any) => {
      Object.assign(model.state, patch);
      version += 1;
      listeners.forEach((listener) => listener());
    };
    return {
      model,
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => { listeners.delete(listener); };
      },
      version: () => version,
    };
  });
  useSyncExternalStore(store.subscribe, store.version, store.version);
  useEffect(() => {
    store.model.componentDidMount?.();
    return () => store.model.componentWillUnmount?.();
  }, [store]);
  return store.model.renderVals();
}

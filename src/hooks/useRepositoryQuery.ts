import { useEffect, useState } from "react";

interface QueryState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
}

export function useRepositoryQuery<T>(query: () => Promise<T>, dependencies: React.DependencyList = []): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    data: undefined,
    error: undefined,
    loading: true,
  });

  useEffect(() => {
    let active = true;
    setState({ data: undefined, error: undefined, loading: true });

    query()
      .then((data) => {
        if (active) setState({ data, error: undefined, loading: false });
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            data: undefined,
            error: error instanceof Error ? error : new Error("Unknown local data error"),
            loading: false,
          });
        }
      });

    return () => {
      active = false;
    };
    // The caller owns dependency stability, like React's built-in effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return state;
}

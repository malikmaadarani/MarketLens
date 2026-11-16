"use client";

import { useCallback, useEffect, useRef } from "react";

export function useDebounce<Args extends unknown[]>(
    callback: (...args: Args) => void | Promise<void>,
    delay: number,
) {
    const callbackRef = useRef(callback);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);
        };
    }, [delay]);

    return useCallback((...args: Args) => {
        if (timeoutRef.current !== null) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            void callbackRef.current(...args);
        }, delay);
    }, [delay]);
}

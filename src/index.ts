const maybe = <T>(x: T): T | undefined => x

/**
 * On the server, returns the value passed in.
 * On the client, returns `undefined`.
 */
export const server$ = maybe

/**
 * On the client, returns the value passed in.
 * On the server, returns `undefined`.
 */
export const client$ = maybe

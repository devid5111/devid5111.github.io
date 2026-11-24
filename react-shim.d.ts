// Ambient type declarations for React and JSX in static Originkit components

declare module "react" {
  export = React;
  export as namespace React;
}

declare namespace React {
  export type CSSProperties = Record<string, any>;
  export type ReactNode = any;
  export type ReactElement<P = any, T = any> = any;
  export type ComponentType<P = any> = any;
  export type FC<P = any> = (props: P) => any;
  export function useEffect(effect: () => void | (() => void), deps?: readonly any[]): void;
  export function useRef<T>(initialValue?: T): { current: T };
  export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
  export type PointerEvent<T = Element> = any;
  export type MouseEvent<T = Element> = any;
  export type KeyboardEvent<T = Element> = any;
  export type ChangeEvent<T = Element> = any;
  export type FormEvent<T = Element> = any;
}

declare module "react/jsx-runtime" {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare module "react/jsx-dev-runtime" {
  export const jsxDEV: any;
  export const Fragment: any;
}

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> {}
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

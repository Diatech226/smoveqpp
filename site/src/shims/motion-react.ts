import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { createElement } from "react";

type MotionProps<T extends ElementType> = ComponentPropsWithoutRef<T> & {
  children?: ReactNode;
};

const motionProxy = new Proxy(
  {},
  {
    get: (_target, tag: string) => {
      const Component = (props: MotionProps<ElementType>) =>
        createElement(tag, props, props.children);
      Component.displayName = `MotionShim(${tag})`;
      return Component;
    },
  },
) as Record<string, (props: MotionProps<ElementType>) => JSX.Element>;

export const motion = motionProxy;

export function useMotionValue<T>(initial: T) {
  return { get: () => initial, set: () => undefined };
}

export function useSpring<T>(value: T) {
  return value;
}

export function useTransform<T>(value: T, _input?: unknown, _output?: unknown) {
  return value;
}

export function useScroll() {
  return {
    scrollY: { get: () => 0, set: () => undefined },
    scrollYProgress: { get: () => 0, set: () => undefined },
  };
}

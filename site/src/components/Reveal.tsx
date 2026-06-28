import { ElementType, HTMLAttributes, ReactNode, createElement, useRef } from 'react';
import { useRevealOnScroll } from '../hooks/useRevealOnScroll';

type RevealVariant = 'fade-up' | 'wipe' | 'scale';

type RevealProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
};

export default function Reveal({
  as,
  children,
  className = '',
  delay = 0,
  variant = 'fade-up',
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);

  return createElement(
    as || 'div',
    {
      ...props,
      ref,
      className: `reveal reveal--${variant} ${className}`.trim(),
      style: { ...style, transitionDelay: delay ? `${delay}ms` : undefined },
    },
    children,
  );
}

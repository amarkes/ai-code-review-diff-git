import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-vscode-button text-vscode-buttonFg hover:opacity-90 disabled:opacity-50',
  secondary:
    'border border-vscode-border bg-vscode-input text-vscode-fg hover:border-vscode-focus disabled:opacity-50',
  ghost: 'text-vscode-fg hover:bg-white/5 disabled:opacity-50',
};

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type="button"
      className={`rounded px-3 py-1.5 text-sm font-medium transition ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

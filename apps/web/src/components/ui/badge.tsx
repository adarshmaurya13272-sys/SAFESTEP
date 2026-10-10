import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-[#38BDF8] text-[#0B1426] hover:bg-[#38BDF8]/80',
        secondary:
          'border-transparent bg-[#14213D] text-[#EEF3FA] hover:bg-[#14213D]/80',
        destructive:
          'border-transparent bg-[#DC2626] text-white hover:bg-[#DC2626]/80',
        outline: 'text-[#EEF3FA] border-white/20',
        success:
          'border-transparent bg-green-500/20 text-green-400 border-green-500/30',
        warning:
          'border-transparent bg-[#F5A524]/20 text-[#F5A524] border-[#F5A524]/30',
        planned:
          'border-dashed border-gray-500 text-gray-400 bg-transparent',
        demo:
          'border-transparent bg-[#F5A524] text-[#0B1426]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/lib/utils'
import { ComponentPropsWithoutRef, ElementRef, forwardRef, ReactNode } from 'react'
import { Typography } from '@/components/Typography'

const Tabs = TabsPrimitive.Root

const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn('flex flex-row gap-x-1', className)} {...props} />
))
TabsList.displayName = TabsPrimitive.TabsList.displayName

const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'data-[state=active]:rounded-md data-[state=active]:bg-primary',
      'data-[state=inactive]:font-light data-[state=inactive]:text-disabled-primary',
      'px-[16px] py-[8px]',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = TabsPrimitive.Content

type TabTitleProps = {
  children: ReactNode
}

// TODO: To be aligned with the design once we have access to dev mode
const TabTitle = ({ children }: TabTitleProps) => (
  <Typography tagVariant="label" fontFamily="rootstock-sans" fontWeight={700}>
    {children}
  </Typography>
)

export { Tabs, TabsList, TabsTrigger, TabsContent, TabTitle }

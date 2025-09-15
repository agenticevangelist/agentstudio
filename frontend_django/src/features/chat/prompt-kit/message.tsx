import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar"
import React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip"
import { cn } from "@/shared/lib/utils"
import { Markdown } from "./markdown"

export type MessageProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

const Message = ({ children, className, ...props }: MessageProps) => (
  <div className={cn("flex gap-3", className)} {...props}>
    {children}
  </div>
)

export type MessageAvatarProps = {
  src: string
  alt: string
  fallback?: React.ReactNode
  delayMs?: number
  className?: string
}

const MessageAvatar = ({
  src,
  alt,
  fallback,
  delayMs,
  className,
}: MessageAvatarProps) => {
  const [loaded, setLoaded] = React.useState(false)
  // Reset loaded state whenever the source changes so fallback shows until the new image loads
  React.useEffect(() => {
    setLoaded(false)
  }, [src])

  return (
    <Avatar className={cn("relative h-8 w-8 shrink-0", className)}>
      <AvatarImage
        src={src}
        alt={alt}
        onLoadingStatusChange={(status) => setLoaded(status === "loaded")}
        className={cn(
          // Smooth fade-in for the image once it loads
          "transition-opacity duration-[3000ms] ease-in-out",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />
      {fallback && (
        <div
          // Persistent overlay so it doesn't unmount when image loads
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-opacity duration-[3000ms] ease-in-out",
            loaded ? "opacity-0" : "opacity-100"
          )}
        >
          {fallback}
        </div>
      )}
    </Avatar>
  )
}

export type MessageContentProps = {
  children: React.ReactNode
  markdown?: boolean
  className?: string
} & React.ComponentProps<typeof Markdown> &
  React.HTMLProps<HTMLDivElement>

const MessageContent = ({
  children,
  markdown = false,
  className,
  ...props
}: MessageContentProps) => {
  const classNames = cn(
    "rounded-lg p-2 text-foreground prose break-words whitespace-normal",
    className
  )

  return markdown ? (
    <Markdown className={classNames} {...props}>
      {children as string}
    </Markdown>
  ) : (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}

export type MessageActionsProps = {
  children: React.ReactNode
  className?: string
} & React.HTMLProps<HTMLDivElement>

const MessageActions = ({
  children,
  className,
  ...props
}: MessageActionsProps) => (
  <div
    className={cn("text-muted-foreground flex items-center gap-2", className)}
    {...props}
  >
    {children}
  </div>
)

export type MessageActionProps = {
  className?: string
  tooltip: React.ReactNode
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  delayDuration?: number
} & React.ComponentProps<typeof Tooltip>

const MessageAction = ({
  tooltip,
  children,
  className,
  side = "top",
  delayDuration,
  ...props
}: MessageActionProps) => {
  return (
    <TooltipProvider delayDuration={delayDuration}
    >
      <Tooltip {...props}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side} className={className}>
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export { Message, MessageAvatar, MessageContent, MessageActions, MessageAction }

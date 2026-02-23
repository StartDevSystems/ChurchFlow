"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Check, AlertCircle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="up">
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props} className="group">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {variant === 'destructive' ? (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                ) : variant === 'success' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Info className="h-4 w-4 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}

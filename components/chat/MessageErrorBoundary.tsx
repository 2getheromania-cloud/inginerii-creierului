'use client'
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export default class MessageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[MessageErrorBoundary] message render crash:', error.message, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="px-3 py-0.5">
          <div className="inline-block rounded-2xl px-3 py-2 bg-gray-100 text-xs text-gray-400 italic">
            Mesaj indisponibil
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

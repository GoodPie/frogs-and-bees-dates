import { render as rtlRender, RenderOptions, RenderResult } from "@testing-library/react"
import { ReactElement } from "react"
import { Provider } from '../src/components/ui/provider'

// Custom render options interface
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialProps?: any
  wrapper?: React.ComponentType<any>
}

// Custom render result interface
interface CustomRenderResult extends RenderResult {
  rerender: (ui: ReactElement) => void
}

// Enhanced render function with Chakra UI provider
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): CustomRenderResult {
  const { wrapper: Wrapper = Provider, ...renderOptions } = options

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <Wrapper>{children}</Wrapper>
  }

  const result = rtlRender(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  })

  return {
    ...result,
    rerender: (newUi: ReactElement) =>
      result.rerender(<AllTheProviders>{newUi}</AllTheProviders>),
  }
}

// Re-export everything from testing library
export * from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
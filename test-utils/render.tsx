import { render as rtlRender, RenderOptions } from "@testing-library/react"
import { ReactElement } from "react"
import { Provider } from '../src/components/ui/provider'

// Custom render options interface
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialProps?: any
  wrapper?: React.ComponentType<any>
}

// Enhanced render function with Chakra UI provider
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { wrapper: Wrapper = Provider, ...renderOptions } = options

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return <Wrapper>{children}</Wrapper>
  }

  return rtlRender(ui, {
    wrapper: AllTheProviders,
    ...renderOptions,
  })
}

// Re-export everything from testing library
export * from "@testing-library/react"
export { default as userEvent } from "@testing-library/user-event"
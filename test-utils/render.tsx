import { render as rtlRender } from "@testing-library/react"
import { Provider } from '../src/components/ui/provider';

export function render(ui: React.ReactNode) {
  return rtlRender(<>{ui}</>, {
    wrapper: (props: React.PropsWithChildren) => (
      <Provider>{props.children}</Provider>
    ),
  })
}
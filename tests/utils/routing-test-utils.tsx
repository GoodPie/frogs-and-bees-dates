import { MemoryRouter } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

interface RenderWithRouterOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderWithRouter(
  ui: React.ReactElement,
  { initialEntries = ['/'], ...options }: RenderWithRouterOptions = {}
) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </ChakraProvider>,
    options
  );
}

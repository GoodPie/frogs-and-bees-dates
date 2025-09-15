import React from "react"
import { screen } from "@testing-library/react"
import { App } from "./App"
import { render } from '../test-utils/render';

test("renders Sign In link", () => {
  render(<App />)
  const linkElement = screen.getByText(/Sign in/i)
  expect(linkElement).toBeInTheDocument()
})

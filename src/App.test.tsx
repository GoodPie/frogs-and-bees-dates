import React from "react"
import { screen } from "@testing-library/react"
import { App } from "./App"
import { render } from '../test-utils/render';
import { expect } from "vitest";

test("renders Sign In link", () => {
  render(<App />)
  const linkElement = screen.getByText(/Refresh Notification/i)
  expect(linkElement).toBeTruthy()
})

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CleanSheet main flow", () => {
  it("imports a CSV, previews it, and starts an export download", async () => {
    const file = new File(["name,city\nLucas,Curitiba"], "customers.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue("name,city\nLucas,Curitiba") });

    const createObjectURL = vi.fn().mockReturnValue("blob:cleansheet-test");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), {
      target: { files: [file] },
    });

    expect(await screen.findByRole("heading", { name: "Prévia dos dados" })).toBeInTheDocument();
    expect(screen.getByText("Lucas")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await waitFor(() => expect(createObjectURL).toHaveBeenCalledTimes(1));
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(await screen.findByRole("status")).toHaveTextContent("Download do CSV iniciado");
  });
});

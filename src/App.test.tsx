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
    expect(await screen.findByText("Download do CSV iniciado.")).toBeInTheDocument();
  });
});

it("shows analysis findings for the imported CSV and highlights affected cells", async () => {
  const csv = "name,email\n Maria ,shared@example.com\nJoão,shared@example.com\nAna,";
  const file = new File([csv], "customers.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue(csv) });

  render(<App />);
  fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), {
    target: { files: [file] },
  });

  expect(await screen.findByRole("heading", { name: "Achados na sua planilha" })).toBeInTheDocument();
  expect(screen.getByText("Espaços extras")).toBeInTheDocument();
  expect(screen.getByText("Valores ausentes")).toBeInTheDocument();

  fireEvent.click(screen.getAllByRole("button", { name: "Ver na prévia" })[0]);
  expect(screen.getByText(/Prévia destacada:/)).toBeInTheDocument();
  expect(document.querySelector("td.data-preview__cell--highlighted")).not.toBeNull();
});


it("reviews and applies selected whitespace fixes, then supports undo and redo", async () => {
  const csv = "name,city\n  Maria  , Curitiba \nJoão,Londrina";
  const file = new File([csv], "customers.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue(csv) });

  render(<App />);
  fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), { target: { files: [file] } });

  expect(await screen.findByRole("heading", { name: "Achados na sua planilha" })).toBeInTheDocument();
  fireEvent.click(screen.getAllByRole("button", { name: "Revisar correção" })[0]);
  const reviewedValues = Array.from(document.querySelectorAll(".trim-review code"))
    .map((element) => element.textContent);
  expect(reviewedValues).toContain('"  Maria  "');
  expect(reviewedValues).toContain('"Maria"');

  fireEvent.click(screen.getByRole("button", { name: "Aplicar correção selecionada" }));
  expect(screen.getByText("Maria")).toBeInTheDocument();
  expect(screen.getByText("1 alteração aplicada")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
  expect(document.querySelector("tbody tr td")?.textContent).toBe("  Maria  ");
  expect(screen.getByText("0 alterações aplicadas")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Refazer" }));
  expect(screen.getByText("Maria")).toBeInTheDocument();
});

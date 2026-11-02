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
    fireEvent.click(await screen.findByRole("button", { name: "Importar arquivo" }));

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
  fireEvent.click(await screen.findByRole("button", { name: "Importar arquivo" }));

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
  fireEvent.click(await screen.findByRole("button", { name: "Importar arquivo" }));

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


it("reviews duplicate values, removes only selected records, and supports undo and redo", async () => {
  const csv = "name,email\nMaria,maria@example.com\nJoão,shared@example.com\nAna,shared@example.com";
  const file = new File([csv], "customers.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue(csv) });

  render(<App />);
  fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), { target: { files: [file] } });
  fireEvent.click(await screen.findByRole("button", { name: "Importar arquivo" }));
  expect(await screen.findByRole("heading", { name: "Achados na sua planilha" })).toBeInTheDocument();

  const duplicateColumn = screen.getByLabelText("Verificar valores repetidos em uma coluna") as HTMLSelectElement;
  const emailOption = Array.from(duplicateColumn.options).find((option) => option.textContent === "email");
  expect(emailOption).toBeDefined();
  fireEvent.change(duplicateColumn, { target: { value: emailOption?.value } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Revisar registros" })).toBeEnabled());

  fireEvent.click(screen.getByRole("button", { name: "Revisar registros" }));
  const reviewCheckboxes = document.querySelectorAll<HTMLInputElement>(".duplicate-review input[type='checkbox']");
  expect(reviewCheckboxes).toHaveLength(2);
  fireEvent.click(reviewCheckboxes[0]);
  fireEvent.click(screen.getByRole("button", { name: "Remover 1 registro selecionado" }));

  expect(screen.getByText("2 linhas × 2 colunas", { exact: false })).toBeInTheDocument();
  expect(screen.queryByText("João")).not.toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
  expect(screen.getByText("João")).toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Refazer" }));
  expect(screen.queryByText("João")).not.toBeInTheDocument();
  expect(screen.getByText("Ana")).toBeInTheDocument();
});

it("keeps mixed transformations in one undo and redo history", async () => {
  const csv = "name,email\n  Maria  ,shared@example.com\nJoão,shared@example.com\nAna,unique@example.com";
  const file = new File([csv], "customers.csv", { type: "text/csv" });
  Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue(csv) });

  render(<App />);
  fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), { target: { files: [file] } });
  fireEvent.click(await screen.findByRole("button", { name: "Importar arquivo" }));
  expect(await screen.findByRole("heading", { name: "Achados na sua planilha" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Revisar correção" }));
  fireEvent.click(screen.getByRole("button", { name: "Aplicar correção selecionada" }));
  expect(document.querySelector("tbody tr td")?.textContent).toBe("Maria");

  const duplicateColumn = screen.getByLabelText("Verificar valores repetidos em uma coluna") as HTMLSelectElement;
  await waitFor(() => expect(duplicateColumn).toBeEnabled());
  const emailOption = Array.from(duplicateColumn.options).find((option) => option.textContent === "email");
  fireEvent.change(duplicateColumn, { target: { value: emailOption?.value } });
  await waitFor(() => expect(screen.getByRole("button", { name: "Revisar registros" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Revisar registros" }));
  fireEvent.click(document.querySelectorAll<HTMLInputElement>(".duplicate-review input[type='checkbox']")[1]);
  fireEvent.click(screen.getByRole("button", { name: "Remover 1 registro selecionado" }));
  expect(screen.queryByText("João")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
  expect(screen.getByText("João")).toBeInTheDocument();
  expect(document.querySelector("tbody tr td")?.textContent).toBe("Maria");

  fireEvent.click(screen.getByRole("button", { name: "Desfazer" }));
  expect(document.querySelector("tbody tr td")?.textContent).toBe("  Maria  ");

  fireEvent.click(screen.getByRole("button", { name: "Refazer" }));
  expect(document.querySelector("tbody tr td")?.textContent).toBe("Maria");
  fireEvent.click(screen.getByRole("button", { name: "Refazer" }));
  expect(screen.queryByText("João")).not.toBeInTheDocument();
});

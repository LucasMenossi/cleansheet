import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dataset } from "../../features/dataset/types";
import { DataAnalysis } from "./DataAnalysis";

const dataset: Dataset = {
  columns: [
    { id: "column-name-id", name: "Name" },
    { id: "column-email-id", name: "Email" },
  ],
  rows: [
    { id: "row-1", values: { Name: " Maria ", Email: "shared@example.com" } },
    { id: "row-2", values: { Name: "João", Email: "shared@example.com" } },
    { id: "row-3", values: { Name: "Ana", Email: "" } },
  ],
};

describe("DataAnalysis", () => {
  it("shows findings from the imported dataset", () => {
    render(<DataAnalysis dataset={dataset} onSelectIssue={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Achados na sua planilha" })).toBeInTheDocument();
    expect(screen.getByText("Espaços extras" )).toBeInTheDocument();
    expect(screen.getByText("Valores ausentes")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum achado encontrado")).not.toBeInTheDocument();
  });

  it("runs duplicate-value analysis only after a column is selected", () => {
    const onSelectIssue = vi.fn();
    render(<DataAnalysis dataset={dataset} onSelectIssue={onSelectIssue} />);

    expect(screen.queryByText("Valores repetidos")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Verificar valores repetidos em uma coluna"), {
      target: { value: "column-email-id" },
    });

    expect(screen.getByText("Valores repetidos")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Valores repetidos em Email" })).toBeInTheDocument();
    expect(screen.getByText(/Linhas do arquivo:\s*2, 3/)).toBeInTheDocument();
  });

  it("notifies the parent when a finding is selected and cleared", () => {
    const onSelectIssue = vi.fn();
    render(<DataAnalysis dataset={dataset} onSelectIssue={onSelectIssue} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Ver na prévia" })[0]);
    expect(onSelectIssue).toHaveBeenLastCalledWith(expect.objectContaining({ ruleId: "trim-whitespace" }));

    fireEvent.click(screen.getByRole("button", { name: "Limpar destaque" }));
    expect(onSelectIssue).toHaveBeenLastCalledWith(null);
  });
});

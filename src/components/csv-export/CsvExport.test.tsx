import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { parseCsv } from "../../lib/csv/parse-csv";
import { CsvExport } from "./CsvExport";

describe("CsvExport", () => {
  it("exports a dataset without formula-like values immediately", () => {
    const onExport = vi.fn();
    const dataset = parseCsv("name,city\nLucas,Curitiba").dataset;
    render(<CsvExport dataset={dataset} delimiter="," onExport={onExport} />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    expect(onExport).toHaveBeenCalledWith("name,city\r\nLucas,Curitiba");
  });

  it("requires explicit confirmation before exporting formula-like values", () => {
    const onExport = vi.fn();
    const dataset = parseCsv("name,note\nLucas,=1+1").dataset;
    render(<CsvExport dataset={dataset} delimiter="," onExport={onExport} />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    expect(screen.getByRole("alert")).toHaveTextContent("podem ser interpretados como fórmulas");
    expect(onExport).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Baixar mesmo assim" }));
    expect(onExport).toHaveBeenCalledWith("name,note\r\nLucas,=1+1");
  });

  it("allows canceling the formula warning", () => {
    const onExport = vi.fn();
    const dataset = parseCsv("name,note\nLucas,=1+1").dataset;
    render(<CsvExport dataset={dataset} delimiter="," onExport={onExport} />);

    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onExport).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

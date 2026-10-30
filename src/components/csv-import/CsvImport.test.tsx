import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CsvImport } from "./CsvImport";

function fileWithText(name: string, content: string) {
  const file = new File([content], name, { type: "text/csv" });
  Object.defineProperty(file, "text", { value: vi.fn().mockResolvedValue(content) });
  return file;
}

describe("CsvImport", () => {
  it("imports a selected CSV and returns its delimiter", async () => {
    const onImport = vi.fn();
    render(<CsvImport onImport={onImport} />);
    fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), {
      target: { files: [fileWithText("customers.csv", "name,city\nLucas,Curitiba")] },
    });

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport.mock.calls[0][1]).toBe(",");
    expect(onImport.mock.calls[0][0].rows[0].values).toEqual({ name: "Lucas", city: "Curitiba" });
  });

  it("imports a CSV dropped onto the dropzone", async () => {
    const onImport = vi.fn();
    render(<CsvImport onImport={onImport} />);
    const dropzone = screen.getByRole("button", { name: "Área para importar CSV" });
    const file = fileWithText("customers.csv", "name;city\nLucas;Curitiba");
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport.mock.calls[0][1]).toBe(";");
  });

  it("shows a clear error for a non-CSV file", async () => {
    const onImport = vi.fn();
    render(<CsvImport onImport={onImport} />);
    fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), {
      target: { files: [new File(["not csv"], "notes.txt", { type: "text/plain" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Selecione um arquivo");
    expect(onImport).not.toHaveBeenCalled();
  });

  it("shows the parser message for malformed CSV", async () => {
    const onImport = vi.fn();
    render(<CsvImport onImport={onImport} />);
    fireEvent.change(screen.getByLabelText("Selecionar arquivo CSV"), {
      target: { files: [fileWithText("broken.csv", "name,city\nLucas,Curitiba,PR")] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("quantidade de campos");
    expect(onImport).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import { detectInconsistentFormats } from "./inconsistent-formats";
import type { Dataset } from "../../dataset/types";

describe("detectInconsistentFormats", () => {
  it("flags values that do not follow a clear majority email format", () => {
    const dataset: Dataset = {
      columns: [{ id: "email", name: "email" }],
      rows: [
        { id: "1", values: { email: "a@example.com" } },
        { id: "2", values: { email: "b@example.com" } },
        { id: "3", values: { email: "not-an-email" } },
      ],
    };
    expect(detectInconsistentFormats(dataset)).toEqual([
      expect.objectContaining({ ruleId: "inconsistent-formats", affectedRowIds: ["3"], affectedColumnIds: ["email"], severity: "warning" }),
    ]);
  });

  it("does not flag a column when there is no clear majority pattern", () => {
    const dataset: Dataset = {
      columns: [{ id: "value", name: "value" }],
      rows: [
        { id: "1", values: { value: "a@example.com" } },
        { id: "2", values: { value: "2025-01-01" } },
        { id: "3", values: { value: "free text" } },
      ],
    };
    expect(detectInconsistentFormats(dataset)).toEqual([]);
  });
});

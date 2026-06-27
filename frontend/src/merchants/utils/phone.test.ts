import { describe, expect, it } from "vitest";
import { formatPhoneDisplay } from "./phone";

describe("formatPhoneDisplay", () => {
  it("returns empty string for empty input", () => {
    expect(formatPhoneDisplay("")).toBe("");
  });

  it("returns single digit without formatting", () => {
    expect(formatPhoneDisplay("1")).toBe("1");
  });

  it("wraps DDD in parentheses after 2 digits", () => {
    expect(formatPhoneDisplay("11")).toBe("(11)");
  });

  it("formats 10 digits as fixo (DD) xxxx-xxxx", () => {
    expect(formatPhoneDisplay("1191234567")).toBe("(11) 9123-4567");
  });

  it("formats 11 digits as movel (DD) 9xxxx-xxxx", () => {
    expect(formatPhoneDisplay("11991234567")).toBe("(11) 99123-4567");
  });

  it("formats intermediate lengths progressively", () => {
    expect(formatPhoneDisplay("119")).toBe("(11) 9");
    expect(formatPhoneDisplay("1199")).toBe("(11) 99");
    expect(formatPhoneDisplay("11999")).toBe("(11) 999");
    expect(formatPhoneDisplay("119999")).toBe("(11) 9999");
    expect(formatPhoneDisplay("1199999")).toBe("(11) 9999-9");
    expect(formatPhoneDisplay("11999999")).toBe("(11) 9999-99");
    expect(formatPhoneDisplay("119999999")).toBe("(11) 9999-999");
    expect(formatPhoneDisplay("1199999999")).toBe("(11) 9999-9999");
  });

  it("strips non-digits before formatting", () => {
    expect(formatPhoneDisplay("(11) 9123-4567")).toBe("(11) 9123-4567");
    expect(formatPhoneDisplay("11a9b1c2d3e4f5g6h7")).toBe("(11) 9123-4567");
    expect(formatPhoneDisplay(" 11 99123-4567 ")).toBe("(11) 99123-4567");
  });

  it("caps input at 11 digits", () => {
    expect(formatPhoneDisplay("119912345678999")).toBe("(11) 99123-4567");
  });

  it("handles backspace-like deletions gracefully", () => {
    expect(formatPhoneDisplay("(11) 9123-456")).toBe("(11) 9123-456");
    expect(formatPhoneDisplay("(11) 9123")).toBe("(11) 9123");
    expect(formatPhoneDisplay("(11) 91")).toBe("(11) 91");
  });
});

import { resolveAppRedirectUrl } from "./redirect";

describe("resolveAppRedirectUrl", () => {
  const origin = "http://localhost:3000";

  it("keeps app-relative redirect urls", () => {
    expect(resolveAppRedirectUrl("/dashboard?tab=reviews#latest", "/fallback", origin)).toBe(
      "/dashboard?tab=reviews#latest"
    );
  });

  it("converts same-origin absolute urls to app-relative paths", () => {
    expect(resolveAppRedirectUrl("http://localhost:3000/dashboard?from=login", "/fallback", origin)).toBe(
      "/dashboard?from=login"
    );
  });

  it("falls back for external absolute urls", () => {
    expect(resolveAppRedirectUrl("https://example.com/dashboard", "/dashboard", origin)).toBe("/dashboard");
  });

  it("normalizes same-origin absolute fallback urls", () => {
    expect(resolveAppRedirectUrl(null, "http://localhost:3000/review/new", origin)).toBe("/review/new");
  });

  it("rejects protocol-relative urls", () => {
    expect(resolveAppRedirectUrl("//example.com/dashboard", "/dashboard", origin)).toBe("/dashboard");
  });
});

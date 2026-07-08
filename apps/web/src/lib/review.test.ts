import { detectLanguage } from "./review";

describe("detectLanguage", () => {
  it("detects Python snippets without imports", () => {
    expect(
      detectLanguage(`# This function adds two numbers
def add(left, right):
    return left + right

print(add(1, 2))`)
    ).toBe("python");
  });

  it("detects Python classes without being confused by comments", () => {
    expect(
      detectLanguage(`# A simple function-style helper object
class Counter:
    def __init__(self):
        self.value = 0`)
    ).toBe("python");
  });

  it("detects JavaScript function syntax", () => {
    expect(
      detectLanguage(`function add(left, right) {
  console.log(left + right);
}`)
    ).toBe("javascript");
  });

  it("prefers TypeScript when type-only syntax is present", () => {
    expect(
      detectLanguage(`interface User {
  name: string;
}`)
    ).toBe("typescript");
  });
});

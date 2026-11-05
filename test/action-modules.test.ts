import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// ---------------------------------------------------------------------------
// Structure and security boundaries of the server action modules.
// The database is a recorder: every call is logged and nothing is stored, so
// these tests can prove that a refused request never reached the database.
// Run with: npx vitest run tests/action-modules.test.ts
// ---------------------------------------------------------------------------

const { db, dbCalls, getServerSession } = vi.hoisted(() => {
  const dbCalls: string[] = [];
  const recorder = (trail: string[]): any =>
    new Proxy(function () {}, {
      get: (_target, property) => recorder([...trail, String(property)]),
      apply: () => {
        dbCalls.push(trail.join("."));
        return Promise.resolve(undefined);
      },
    });
  return { db: recorder([]), dbCalls, getServerSession: vi.fn() };
});

vi.mock("@/utils/db", () => ({ default: db }));
vi.mock("next-auth", () => ({ getServerSession }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/utils/supabase", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

import * as barrel from "@/utils/action";
import * as admin from "@/utils/actions/admin";
import { isValidPrice, isValidQuantity } from "@/utils/validation";

const utilsDir = path.resolve(process.cwd(), "utils");
const DOMAIN_MODULES = [
  "catalog",
  "admin",
  "favorites",
  "reviews",
  "cart",
  "orders",
  "session",
];

const parse = (file: string) =>
  ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.ES2020,
    true,
  );

// True only for a real "use server" directive, not for a comment that mentions it.
const hasUseServerDirective = (file: string) => {
  const first = parse(file).statements[0];
  return (
    !!first &&
    ts.isExpressionStatement(first) &&
    ts.isStringLiteral(first.expression) &&
    first.expression.text === "use server"
  );
};

const isExported = (statement: ts.Statement) =>
  (ts.canHaveModifiers(statement)
    ? (ts.getModifiers(statement) ?? [])
    : []
  ).some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);

describe("public surface", () => {
  it("still exports everything the app imports from @/utils/action", () => {
    expect(Object.keys(barrel).sort()).toEqual(
      [
        "addToCartAction",
        "createOrderAction",
        "createProduction",
        "createReviewAction",
        "default",
        "deleteProductAction",
        "deleteReviewAction",
        "fetchAdminOrders",
        "fetchAdminProductDetails",
        "fetchAdminProducts",
        "fetchAllProducts",
        "fetchCartForDisplay",
        "fetchCartItems",
        "fetchFavoriteId",
        "fetchFeaturedPro",
        "fetchFilteredProducts",
        "fetchOrCreateCart",
        "fetchProductRating",
        "fetchProductReviews",
        "fetchProductReviewsByUser",
        "fetchProductsByMuscle",
        "fetchSimilarProducts",
        "fetchSingleProduct",
        "fetchSingleProductWithMuscles",
        "fetchUserFavorites",
        "fetchUserOrders",
        "findExistingReview",
        "getProductById",
        "removeCartItemAction",
        "toggleFavorite",
        "updateCart",
        "updateCartItemAction",
        "updateCartOrCreateItemAction",
        "updateProductAction",
        "updateProductImageAction",
      ].sort(),
    );
  });

  it("does not expose the guard helpers as named exports", () => {
    expect(Object.keys(barrel)).not.toContain("getAdminUser");
    expect(Object.keys(barrel)).not.toContain("getAuthUser");
  });
});

describe("module boundaries", () => {
  it.each(DOMAIN_MODULES)(
    "%s is a use-server module that exports only async functions",
    (name) => {
      const file = path.join(utilsDir, "actions", `${name}.ts`);
      expect(hasUseServerDirective(file)).toBe(true);

      const notAsync: string[] = [];
      for (const statement of parse(file).statements) {
        if (!isExported(statement)) continue;
        if (
          ts.isTypeAliasDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement)
        )
          continue;
        const initializer = ts.isVariableStatement(statement)
          ? statement.declarationList.declarations[0].initializer
          : undefined;
        const isAsyncFunction = ts.isFunctionDeclaration(statement)
          ? !!statement.modifiers?.some(
              (m) => m.kind === ts.SyntaxKind.AsyncKeyword,
            )
          : !!initializer &&
            (ts.isArrowFunction(initializer) ||
              ts.isFunctionExpression(initializer)) &&
            !!initializer.modifiers?.some(
              (m) => m.kind === ts.SyntaxKind.AsyncKeyword,
            );
        if (!isAsyncFunction) notAsync.push(statement.getText().slice(0, 40));
      }
      expect(notAsync).toEqual([]);
    },
  );

  it.each(["guards.ts", "validation.ts", "action.ts"])(
    "%s is not a use-server file, so it exposes no endpoints",
    (name) => {
      expect(hasUseServerDirective(path.join(utilsDir, name))).toBe(false);
    },
  );

  it("only re-exports from use-server modules, so client components never pull in server code", () => {
    // Client components import this barrel. Anything it re-exports from a plain
    // module (guards, db, auth) would be bundled for the browser, database
    // driver included, and the build would fail.
    const barrelFile = path.join(utilsDir, "action.ts");
    const sources = parse(barrelFile).statements.flatMap((statement) =>
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      ts.isStringLiteral(statement.moduleSpecifier)
        ? [statement.moduleSpecifier.text]
        : [],
    );
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      const file = path.resolve(utilsDir, `${source}.ts`);
      expect(hasUseServerDirective(file), source).toBe(true);
    }
  });

  it("keeps the barrel free of logic: it only re-exports", () => {
    const statements = parse(path.join(utilsDir, "action.ts")).statements;
    expect(statements.length).toBeGreaterThan(0);
    for (const statement of statements) {
      expect(ts.isExportDeclaration(statement)).toBe(true);
    }
  });
});

describe("default export (getAuthUser)", () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it("returns the logged-in user", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "u1", email: "u1@example.com" },
    });

    await expect((barrel as any).default()).resolves.toEqual({
      id: "u1",
      email: "u1@example.com",
    });
  });

  it("refuses a logged-out visitor", async () => {
    getServerSession.mockResolvedValue(null);

    await expect((barrel as any).default()).rejects.toThrow(
      "You must be logged in",
    );
  });
});

describe("admin module", () => {
  beforeEach(() => {
    dbCalls.length = 0;
    getServerSession.mockReset();
    vi.stubEnv("ADMIN_EMAIL", "admin@example.com");
  });

  const everyAdminExport = () =>
    Object.entries(admin) as [
      string,
      (...args: unknown[]) => Promise<unknown>,
    ][];

  it("has operations to protect", () => {
    expect(everyAdminExport().length).toBeGreaterThanOrEqual(7);
  });

  it("refuses a signed-in customer on every export, before touching data", async () => {
    getServerSession.mockResolvedValue({
      user: { id: "customer-1", email: "customer@example.com" },
    });

    for (const [name, operation] of everyAdminExport()) {
      await expect(operation({}, new FormData()), name).rejects.toThrow(
        "NEXT_REDIRECT:/",
      );
    }
    expect(dbCalls).toEqual([]);
  });

  it("refuses a logged-out visitor on every export, before touching data", async () => {
    getServerSession.mockResolvedValue(null);

    for (const [name, operation] of everyAdminExport()) {
      await expect(operation({}, new FormData()), name).rejects.toThrow();
    }
    expect(dbCalls).toEqual([]);
  });

  it("refuses everyone on every export when no admin email is configured", async () => {
    vi.stubEnv("ADMIN_EMAIL", undefined);
    getServerSession.mockResolvedValue({ user: { id: "someone" } });

    for (const [name, operation] of everyAdminExport()) {
      await expect(operation({}, new FormData()), name).rejects.toThrow(
        "NEXT_REDIRECT:/",
      );
    }
    expect(dbCalls).toEqual([]);
  });
});

describe("shared validation", () => {
  it.each([1, 2, 50, 99])("accepts the quantity %s", (value) => {
    expect(isValidQuantity(value)).toBe(true);
  });

  it.each([0, -1, 1.5, 100, NaN, Infinity])(
    "rejects the quantity %s",
    (value) => {
      expect(isValidQuantity(value)).toBe(false);
    },
  );

  it.each([1, 700, 99999])("accepts the price %s", (value) => {
    expect(isValidPrice(value)).toBe(true);
  });

  it.each([0, -5, 1.5, NaN])("rejects the price %s", (value) => {
    expect(isValidPrice(value)).toBe(false);
  });
});

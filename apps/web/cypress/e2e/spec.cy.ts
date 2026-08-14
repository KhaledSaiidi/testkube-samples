const APP_ORIGIN = "/";

describe("three-tier application", () => {
  beforeEach(() => {
    cy.visit(APP_ORIGIN);
  });

  it("counts", () => {
    const btn = cy.get('[data-cy="count"]');
    btn.should("have.text", "count is 0");
    btn.click();
    btn.should("have.text", "count is 1");
  });

  it("calls the API through the frontend", () => {
    cy.get('[data-cy="greet-api"]').parents(".card").within(() => {
      cy.get("input").type("platform");
      cy.get('[data-cy="greet-api"]').click();
      cy.get("code").should("have.text", "hello, platform");
    });
  });

  it("calls PostgreSQL through the API", () => {
    cy.get('[data-cy="greet-db"]').parents(".card").within(() => {
      cy.get('[data-cy="greet-db"]').click();
      cy.get("code").should("have.text", "hello world from postgres");
    });
  });
});

import { initializeData } from './common'

describe('Add transaction', () => {
  it('creates a new transaction', () => {
    cy.firebaseLogin()
    initializeData()

    cy.visit('/')
    cy.contains('Add transaction').should('be.visible')
    cy.dataCy('tag-field-wrapper').find('input').focus()
    cy.focused().type('A')
    cy.findByText('AAA').click()
    cy.focused().type('B')
    cy.findByText('BBB').click()
    cy.focused().tab()
    cy.focused().type('550.99').tab().tab()
    cy.focused().type('New TV')
    cy.focused().type('{enter}')

    cy.findByText(/transactions/i).click()
    cy.dataCy('transaction').should('have.length', 2)
  })
})

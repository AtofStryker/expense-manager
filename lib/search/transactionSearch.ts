import isAfter from 'date-fns/isAfter'
import isBefore from 'date-fns/isBefore'
import parse from 'date-fns/parse'

import { RepeatingOptions, Tag, Transaction } from '../addTransaction/state'
import { CURRENCIES } from '../shared/currencies'
import { TransactionSearch } from '../state'
import { ObjectOf } from '../types'

import { booleanOptions } from './common'

const isValidDate = (query: string) => {
  return (
    !!/^\d*\.\d*\.\d*$/.exec(query) &&
    // date-fns parse is not very strict and (e.g. Date("2") is parsed)
    !Number.isNaN(
      // date-fns parse is not very strict and (e.g. Date("2") is parsed)
      parse(query, 'd.M.y', new Date()).getTime()
    )
  )
}

type PredicateExtra = {
  tags: ObjectOf<Tag>
}

interface CommandBase {
  name: string
  predicate: (tx: Transaction, query: string, other: PredicateExtra) => boolean
}

interface CommandWithValidation extends CommandBase {
  queryValidation: ((query: string) => boolean) | 'none'
}

const validateCommandWithOptions = (command: CommandWithOptions, query: string) => {
  return command.valueOptions.includes(query)
}

interface CommandWithOptions extends CommandBase {
  valueOptions: string[]
}

export const isCommandWithValidation = (command: any): command is CommandWithValidation => {
  return command.queryValidation !== undefined
}

export type Command = CommandWithValidation | CommandWithOptions

export const COMMANDS: Command[] = [
  {
    // TODO: change to CommandWithOptions
    name: 'tag',
    predicate: (tx, query, { tags }) =>
      !!tx.tagIds.find((tagId) => tags[tagId].name.toLowerCase().includes(query.toLowerCase())),
    queryValidation: 'none',
  },
  {
    name: 'amount-over',
    predicate: (tx, query) => tx.amount > Number.parseFloat(query),
    queryValidation: (query) =>
      // https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
      !isNaN(query as any) && !isNaN(parseFloat(query)),
  },
  {
    name: 'amount-under',
    predicate: (tx, query) => tx.amount < Number.parseFloat(query),
    queryValidation: (query) =>
      // https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
      !isNaN(query as any) && !isNaN(parseFloat(query)),
  },
  {
    name: 'date-before',
    predicate: (tx, query) => isAfter(parse(query, 'd.M.y', new Date()), tx.dateTime),
    queryValidation: (query) => isValidDate(query),
  },
  {
    name: 'date-after',
    predicate: (tx, query) => isBefore(parse(query, 'd.M.y', new Date()), tx.dateTime),
    queryValidation: (query) => isValidDate(query),
  },
  {
    name: 'currency',
    predicate: (tx, query) => tx.currency === query,
    valueOptions: Object.keys(CURRENCIES),
  },
  {
    name: 'is-expense',
    predicate: (tx, query) => {
      const wantExpense = query === 'true'
      return (tx.type === 'expense') === wantExpense
    },
    valueOptions: booleanOptions,
  },
  {
    name: 'note',
    predicate: (tx, query) => tx.note.includes(query),
    queryValidation: 'none',
  },
  {
    name: 'repeating',
    predicate: (tx, query) => tx.repeating === query,
    valueOptions: Object.keys(RepeatingOptions),
  },
  {
    name: 'is-autotag',
    predicate: (tx, query, { tags }) => !!tx.tagIds.find((tagId) => !!tags[tagId].automatic === (query === 'true')),
    valueOptions: booleanOptions,
  },
  {
    name: 'with-default-amount',
    predicate: (tx, query, { tags }) => !!tx.tagIds.find((tagId) => !!tags[tagId].defaultAmount === (query === 'true')),
    valueOptions: booleanOptions,
  },
  {
    name: 'tag-count',
    predicate: (tx, query) => tx.tagIds.length === Number.parseInt(query),
    queryValidation: (
      query // https://stackoverflow.com/questions/175739/built-in-way-in-javascript-to-check-if-a-string-is-a-valid-number
    ) => !isNaN(query as any) && !isNaN(parseInt(query)),
  },
  {
    name: 'has-note',
    predicate: (tx, hasNote) => (tx.note === '') === (hasNote === 'false'),
    valueOptions: booleanOptions,
  },
]

export const search = (txs: Transaction[], query: TransactionSearch, other: PredicateExtra) => {
  if (query.value === '') return txs

  const command = COMMANDS.find((c) => c.name == query.command!)!
  return txs.filter((tx) => command.predicate(tx, query.value, other))
}

export const isValidQuery = (query: TransactionSearch): boolean => {
  const command = COMMANDS.find((c) => c.name == query.command!)
  if (command === undefined) return false
  else if (query.value === '') return true
  else if (isCommandWithValidation(command))
    return command.queryValidation === 'none' || command.queryValidation(query.value)
  else return validateCommandWithOptions(command, query.value)
}

export const OPERATORS = ['AND', 'OR', 'QUERY', 'COMPUTE']

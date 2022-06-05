import { createSelector } from 'reselect'
import { v4 as uuid } from 'uuid'

import { RepeatingOption, RepeatingOptions, Tag, Transaction } from '../addTransaction/state'
import { CURRENCIES, Currency } from '../shared/currencies'
import { currentUserIdSel } from '../shared/selectors'
import { isValidDate } from '../shared/utils'
import { SerializableState, State } from '../state'
import { ObjectOf } from '../types'

export const tagsSel = (state: State) => state.tags
export const transactionsSel = (state: State) => state.transactions
const profileSel = (state: State) => state.profile

type Deserializer<U extends ObjectOf<any>> = {
  [key in keyof U['id']]: (value: unknown) => U['id'][key]
}
type Deserializers = {
  [key in keyof SerializableState]: Partial<Deserializer<SerializableState[key]>>
}

const deserializers: Deserializers = {
  tags: {},
  profile: {},
  transactions: {
    dateTime: (str: any) => new Date(str),
  },
}

/**
 * We are extracting the serializable state properties not to forget to
 * export a piece of state once we add new features.
 */
const serializableStateSel = createSelector(
  tagsSel,
  transactionsSel,
  profileSel,
  (tags, transactions, profile): SerializableState => ({
    tags,
    transactions,
    profile,
  })
)

/**
 * Data returned from this selector are lossy! The purpose of this is to export
 * the data to a table compatible format.
 */
export const csvFromDataSel = createSelector(serializableStateSel, ({ transactions, tags }) => {
  const lines = Object.values(transactions).map((tx) =>
    [
      tx.dateTime.toISOString(),
      tx.amount,
      tx.type,
      tx.tagIds.map((id) => tags[id].name).join('|'),
      tx.note,
      tx.currency,
      tx.repeating,
    ].join(',')
  )

  return lines.join('\n')
})
export interface ImportedData extends SerializableState {
  errorReason?: string
}

/**
 * Changes dateTime format from dd.mm.yyyy to yyyy-mm-ddT00:00:00.000Z
 *
 * if note contains time in hh:mm:ss format, it returns yyyy.mm.ddThh:mm:ss.000
 */
const formatDateToIso = (date: string, note: string) => {
  const dateWithDash = date.split('.').reverse().join('-')
  const time = note.match(/\d\d:\d\d:\d\d/)
  if (time === null) return dateWithDash + 'T00:00:00.000'
  return dateWithDash + 'T' + time[0] + '.000'
}

const formatTbCvs = (importedCsv: string) => {
  let errorReasonTB: string | undefined
  const lines = importedCsv.trim().split('\n')
  const formatedLines = lines.map(() => '').slice(1)
  if (lines.length <= 1) errorReasonTB = 'Csv file has to contain at leats one line of data'
  try {
    for (const [index, line] of lines.slice(1).entries()) {
      const tx = line.split(',')
      const amount = (tx[2] + '.' + tx[3]).replace(/"/g, '')
      if (tx.length < 15) {
        errorReasonTB = 'Lines have to consist of at least 15 columns'
      } else if (tx[0].match(/^\d\d.\d\d.\d\d\d\d$/) === null) {
        errorReasonTB = tx[0] + ' is not a valid date'
      } else if (amount.match(/^\d+(\.\d{1,2})?$/) === null) {
        errorReasonTB = amount.replace('.', ',') + ' is not a valid amount format'
      } else if (!Object.keys(CURRENCIES).includes(tx[4])) {
        errorReasonTB = tx[4] + ' is an invalid currency'
      } else if (tx[5] !== 'Kredit' && tx[5] !== 'Debet') {
        errorReasonTB = 'Columns 5 has to be "Kredit" or "Debet" and it is ' + tx[5]
      }

      if (errorReasonTB) break

      const formatedLine = Array(6) as string[]
      formatedLine[0] = formatDateToIso(tx[0], tx[14])
      formatedLine[1] = tx[5] === 'Kredit' ? amount : '-' + amount
      formatedLine[2] = 'createdFromCSV'
      formatedLine[3] = tx[14]
      formatedLine[4] = tx[4]
      formatedLine[5] = 'none'
      formatedLines[index] = formatedLine.join(',')
    }
  } catch (e) {
    errorReasonTB = 'Unexpected error while parsing CSV from TB'
  }
  return { formatedLines, errorReasonTB }
}

/**
 * Imported csv file must have the following column structure:
 *  1. date - in ISO 8601 format
 *  2. amount - 2 decimal places, negative values means expenses, positive are incomes
 *  3. type - 'expense' or 'income' or 'transfer'
 *  4. tags - separated by '|' (pipe)
 *  5. note - optional
 *  6. currency - currency value of transaction (see list of available currency values)
 *  7. repeating - one of the supported repeating modes
 *  other columns are ignored
 *
 * Or their name has to start with 'TB', then file must have the following column structure
 *  1. date - in dd.mm.yyyy format
 *  3. amount - part before decimal point
 *  4. amount - part after decimal point
 *  5. currency - currency value of transaction (see list of available currency values)
 *  6. type - 'Kredit' meaning income and 'Debet' expense
 *  15. note - optional, if note includes time (hh:mm:ss), it will be used as transaction time
 *  amount fields have to be in absolute numbers
 *  other columns are ignored
 */
export const dataFromImportedCsvSel = (importedCsv: string, importedFileName: string) =>
  createSelector(currentUserIdSel, tagsSel, (userId, stateTags): ImportedData => {
    let lines: string[]
    let errorReason: string | undefined
    if (importedFileName.startsWith('TB')) {
      const { formatedLines, errorReasonTB } = formatTbCvs(importedCsv)
      lines = formatedLines
      errorReason = errorReasonTB
    } else {
      lines = importedCsv.trim().split('\n')
    }
    const txs: ObjectOf<Transaction> = {}
    const newTagsByName = new Map<string, Tag>()
    const stateTagsByName = Object.values(stateTags).reduce(
      (acc, tag) => ({ ...acc, [tag.name]: tag }),
      {} as ObjectOf<Tag>
    )

    if (errorReason) return { errorReason, transactions: txs, tags: {}, profile: {} }

    try {
      for (const line of lines) {
        const t = line.split(',')

        const dt = deserializers.transactions.dateTime!(t[0])
        const rawTags = t[3].trim()
        if (!isValidDate(dt)) {
          errorReason = `${t[0]} is not a valid date`
        } else if (/^\d+(\.\d{1,2})?$/.exec(t[1]) === null) {
          errorReason = `${t[1]} is not in a valid amount format`
        } else if (t[2] !== 'expense' && t[2] !== 'income' && t[2] !== 'transfer') {
          errorReason = `type has to be "expense" or "income" or "transfer" not ${t[2]}`
        } else if (rawTags.length === 0) {
          errorReason = `There must be at least one tag in a transaction`
        } else if (!Object.keys(CURRENCIES).find((value) => value === t[5])) {
          errorReason = `Invalid currency of a transaction`
        } else if (!Object.keys(RepeatingOptions).includes(t[6] as RepeatingOption)) {
          errorReason = `Invalid repeating mode ${t[6]}`
        }

        if (errorReason) {
          break
        }

        const amount = Number.parseFloat(t[1])
        const splitTags = rawTags.split('|')
        splitTags.forEach((tag) => {
          if (!stateTagsByName[tag] && !newTagsByName.has(tag)) {
            newTagsByName.set(tag, {
              id: uuid(),
              name: tag,
              uid: userId!,
              // by default all tags are non automatic
              automatic: false,
            })
          }
        })
        const txId = uuid()
        txs[txId] = {
          id: txId,
          amount: amount,
          currency: t[5] as any as Currency,
          dateTime: dt,
          type: t[2] as 'expense' | 'income' | 'transfer',
          note: t[4],
          tagIds: splitTags.map((tag) => {
            if (newTagsByName.get(tag)) {
              return newTagsByName.get(tag)!.id
            } else {
              return stateTagsByName[tag].id
            }
          }),
          uid: userId!,
          repeating: t[6] as RepeatingOption,
        }
      }
    } catch (e) {
      errorReason = 'Unexpected import error. Check whether the data are in correct format.'
    }

    const tagsObject = [...newTagsByName.values()].reduce((acc, t) => {
      acc[t.id] = t
      return acc
    }, {})
    return { errorReason, transactions: txs, tags: tagsObject, profile: {} }
  })

export const jsonFromDataSel = createSelector(serializableStateSel, (serializableState) =>
  JSON.stringify(serializableState, null, 2)
)

export const dataFromImportedJsonSel = (importedJsonString: string) =>
  createSelector(serializableStateSel, (serializableState): ImportedData => {
    let importedData: SerializableState = {
      tags: {},
      transactions: {},
      profile: {},
    }
    const keys = Object.keys(serializableState) as Array<keyof SerializableState>

    // try to load the data from JSON
    try {
      importedData = JSON.parse(importedJsonString)
    } catch {
      return {
        errorReason: 'Unable to parse the JSON file. Are you sure the file is a JSON file?',
        ...importedData,
      }
    }

    // verify that the JSON file matches what we expect
    const missingField = keys.find((key) => !importedData[key])
    if (missingField) {
      return {
        errorReason: `Imported data does not contain all required fields. Missing field: '${missingField}'`,
        ...importedData,
      }
    }

    // make sure we are not overriding any of the state in the application
    let overridenId: string | undefined
    const overridenField = keys.find((key: keyof SerializableState) => {
      const currData = serializableState[key]
      const newData = importedData[key]

      return Object.keys(newData).some((k) => {
        if (currData[k]) overridenId = k
        return !!overridenId
      })
    })
    if (overridenField) {
      return {
        errorReason: `Imported data would override current data. Specifically, field '${overridenField}' with id '${overridenId}'`,
        ...importedData,
      }
    }

    // verify there are no tags with the same name
    const currData = serializableState['tags']
    const newData = importedData['tags']
    const tagWithSameName = Object.values(newData).find((d) => {
      return Object.values(currData).find((cd) => cd.name === d.name)
    })
    if (tagWithSameName) {
      return {
        errorReason: `There is already a tag with name: '${tagWithSameName.name}' and id '${tagWithSameName.id}'`,
        ...importedData,
      }
    }

    // deserialize the values
    keys.forEach((key) => {
      const desKeys = Object.keys(deserializers[key])
      desKeys.forEach((desKey) => {
        const desFn = deserializers[key][desKey]

        const dataKeys = Object.keys(importedData[key])
        dataKeys.forEach((dataKey) => {
          importedData[key][dataKey][desKey] = desFn(importedData[key][dataKey][desKey])
        })
      })
    })

    return importedData
  })

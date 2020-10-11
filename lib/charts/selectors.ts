import { update } from '@siegrift/tsfunct'
import differenceInCalendarDays from 'date-fns/differenceInCalendarDays'
import format from 'date-fns/format'
import isWithinInterval from 'date-fns/isWithinInterval'
import subDays from 'date-fns/subDays'
import filter from 'lodash/filter'
import map from 'lodash/map'
import range from 'lodash/range'
import reduce from 'lodash/reduce'
import { createSelector } from 'reselect'

import { sorted } from '../shared/utils'
import { State } from '../state'
import { sortedTransactionsSel } from '../transactions/selectors'

export const tagsSel = (state: State) => state.tags
export const transactionsSel = (state: State) => state.transactions

export interface TagShare {
  id: string
  label: string
  value: number
}

const totalAmountSel = (state: State) =>
  reduce(state.transactions, (acc, tx) => acc + tx.amount, 0)

export const tagSharesSel = createSelector(
  tagsSel,
  transactionsSel,
  totalAmountSel,
  (tags, txs, total): TagShare[] => {
    const tagShares = map(tags, (tag) => {
      const filteredTx = filter(txs, (tx) => tx.tagIds.includes(tag.id))
      const sum = reduce(filteredTx, (acc, tx) => acc + tx.amount, 0)

      return {
        id: tag.id,
        label: tag.name,
        value: Math.round((sum / total) * 100 * 100) / 100,
      }
    })

    // descending sort
    return sorted(tagShares, (t1, t2) => t2.value - t1.value)
  },
)

export type DisplayMode = 'best-fit' | 'all'

export const displayDataSel = (width: number, displayMode: DisplayMode) =>
  createSelector(sortedTransactionsSel, (txs) => {
    // 45 is ad-hoc const that works well with current xAxis format (dd.MM)
    const LABEL_WIDTH_PX = 45

    let xAxisMergeSize: number
    let daysToDisplay = 1
    if (displayMode === 'best-fit' || !txs.length) {
      daysToDisplay = Math.round(width / LABEL_WIDTH_PX)
      xAxisMergeSize = 1 // show every label
    } else {
      daysToDisplay = differenceInCalendarDays(
        new Date(),
        txs[txs.length - 1].dateTime,
      )
      // `width / LABEL_WIDTH_PX` is the number of labels displayed on xAxis
      xAxisMergeSize = Math.round(daysToDisplay / (width / LABEL_WIDTH_PX))
    }

    // on the first render this selector is called with `width` 0, providing
    daysToDisplay = Math.max(1, daysToDisplay)

    return { xAxisMergeSize, daysToDisplay }
  })

export const recentBalanceDataSel = (
  daysToDisplay: number,
  dateFormat: string,
) =>
  createSelector(transactionsSel, (transactions) => {
    interface LineChartData {
      amount: number
      dataIndex: number
      isExpense: boolean
    }

    const now = new Date()
    const days = range(daysToDisplay)
      .map((i) => format(subDays(now, i), dateFormat))
      .reverse()

    const groupedTransactions = Object.values(transactions)
      .filter((tx) =>
        // isWithinInterval is inclusive
        {
          return isWithinInterval(tx.dateTime, {
            start: subDays(now, daysToDisplay - 1),
            end: now,
          })
        },
      )
      .map(
        (tx): LineChartData => ({
          // TODO: convert the amount to the mainCurrency
          amount: tx.amount,
          isExpense: tx.isExpense,
          dataIndex: days.indexOf(format(tx.dateTime, dateFormat)),
        }),
      )
      .reduce(
        (acc, tx) => update(acc, [tx.dataIndex], (d) => [...d, tx]),
        range(daysToDisplay).map(() => [] as LineChartData[]),
      )

    const data = [
      {
        id: 'expense',
        color: 'rgb(244, 117, 96)',
        data: days.map((_, index) => ({ x: index, y: 0, index })),
      },
      {
        id: 'income',
        color: 'rgb(38, 217, 98)',
        data: days.map((_, index) => ({ x: index, y: 0, index })),
      },
    ]

    groupedTransactions.forEach((txs, dataInd) => {
      txs.forEach((tx) => {
        data[tx.isExpense ? 0 : 1].data[dataInd].y += tx.amount
      })
    })

    return { days, data }
  })

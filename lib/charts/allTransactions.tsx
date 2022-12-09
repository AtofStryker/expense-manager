import React from 'react'

import { Sunburst } from '@nivo/sunburst'
import reduce from 'lodash/reduce'
import { useSelector } from 'react-redux'

import { Transaction } from '../addTransaction/state'
import { State } from '../state'

import { TagShare, tagSharesSel } from './selectors'

const MAX_LEVELS = 4
const MAX_BRANCHING_PER_LEVEL = [8, 6, 4, 2]

type ChartDataLeaf = {
  name: string
  amount: number
}

type ChartDataNode = {
  name: string
  children: Array<ChartDataNode | ChartDataLeaf>
}

const createDataLeaf = (txs: Transaction[], tags: TagShare[], usedTagIds: string[]) => {
  const txTags = tags.filter((t) => !usedTagIds.includes(t.id) && txs[0].tagIds.includes(t.id)).map((t) => t.label)
  return { name: txTags.join(','), amount: txs[0].amount }
}

const createRecData = (
  txs: Transaction[],
  tags: TagShare[],
  level: number,
  usedTagIds: string[]
): Array<ChartDataNode | ChartDataLeaf> => {
  if (txs.length === 1) {
    return [createDataLeaf(txs, tags, usedTagIds)]
  }
  if (level === MAX_LEVELS - 1) {
    return [
      {
        name: '...',
        amount: reduce(txs, (acc, tx) => acc + tx.amount, 0),
      },
    ]
  }

  const txSet = new Set<Transaction>(txs)
  const ans: Array<ChartDataNode | ChartDataLeaf> = []
  let branch = 0
  tags.forEach((tag) => {
    if (usedTagIds.includes(tag.id) || branch >= MAX_BRANCHING_PER_LEVEL[level]) {
      return
    }

    const newTxs: Transaction[] = []
    for (const tx of txSet) {
      if (tx.tagIds.includes(tag.id)) {
        newTxs.push(tx)
        txSet.delete(tx)
      }
    }

    if (newTxs.length > 0) {
      branch++
      if (newTxs.length > 1) {
        ans.push({
          name: tag.label,
          children: createRecData(newTxs, tags, level + 1, [...usedTagIds, tag.id]),
        })
      } else {
        ans.push(createDataLeaf(newTxs, tags, usedTagIds))
      }
    }
  })

  return ans
}

interface Props {
  width: number
  height: number
}

const AllTransactions = ({ width, height }: Props) => {
  const tagShares = useSelector(tagSharesSel)
  const transactions = useSelector((state: State) => Object.values(state.transactions))

  const data = createRecData(transactions, tagShares, 0, [])

  return (
    <Sunburst
      width={width}
      height={height}
      data={{ name: 'root', children: data }}
      margin={{ top: 30, right: 0, bottom: 30, left: 0 }}
      value="amount"
      cornerRadius={2}
      borderWidth={1}
      borderColor="white"
      colors={{ scheme: 'nivo' }}
      childColor={{ from: 'color' }}
      animate
      isInteractive
    />
  )
}

export default AllTransactions

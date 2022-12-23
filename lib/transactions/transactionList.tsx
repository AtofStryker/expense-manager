import { createRef, useEffect } from 'react'

import { Theme, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import { useDispatch } from 'react-redux'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { makeStyles } from 'tss-react/mui'

import { Transaction as TransactionType } from '../addTransaction/state'
import { useIsBigDevice } from '../shared/hooks'

import { setCursor } from './actions'
import Transaction from './transaction'

type Props = {
  transactions: TransactionType[]
}

const useStyles = makeStyles()((theme: Theme) => ({
  noTransactionsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '100%',
  },
  noTransactions: { textAlign: 'center' },
  searchBar: { marginBottom: theme.spacing(2) },
}))

interface ScrollAwareListProps {
  width: number
  height: number
  transactions: TransactionType[]
}

/**
 * This component needs to be isolated because we use ref to imperatively scroll the list.
 * If this component is inlined in TransactionList directly, the flow "txs list -> edit tx -> back
 * button -> back txs list" will not scroll the correct list item (because ref is undefined).
 *
 * Not sure exactly why this is happening, but its probably due to how nextjs routing works.
 */
const ScrollAwareList = ({ width, height, transactions }: ScrollAwareListProps) => {
  const listRef = createRef<FixedSizeList>()
  const bigDevice = useIsBigDevice()
  const router = useRouter()
  const dispatch = useDispatch()
  const itemSize = bigDevice ? 70 : 100

  // try to center the element that is in the hash
  const hash = router.asPath.split('#')[1]
  useEffect(() => {
    const curr = listRef.current
    const ind = transactions.findIndex((tx) => tx.id === hash)

    dispatch(setCursor(ind))
    if (curr && ind != -1) curr.scrollToItem(ind, 'auto')
  }, [hash, transactions, itemSize, listRef, dispatch])

  return (
    <FixedSizeList
      ref={listRef}
      height={height}
      width={width}
      itemSize={itemSize}
      itemCount={transactions.length}
      itemData={transactions}
    >
      {Transaction}
    </FixedSizeList>
  )
}

const TransactionList = ({ transactions }: Props) => {
  const { classes } = useStyles()

  return (
    <>
      {transactions.length === 0 ? (
        <div className={classes.noTransactionsWrapper}>
          <Typography variant="overline" display="block" gutterBottom className={classes.noTransactions}>
            You have no transactions...
          </Typography>
        </div>
      ) : (
        <AutoSizer>
          {({ height, width }) => {
            return <ScrollAwareList width={width} height={height} transactions={transactions} />
          }}
        </AutoSizer>
      )}
    </>
  )
}

export default TransactionList

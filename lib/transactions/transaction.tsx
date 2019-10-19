import Chip from '@material-ui/core/Chip'
import Divider from '@material-ui/core/Divider'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import { makeStyles, Theme } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import formatDistance from 'date-fns/formatDistance'
import React from 'react'
import { useSelector } from 'react-redux'
import { ListChildComponentProps } from 'react-window'

import { getCurrencySymbol } from '../shared/currencies'
import { State } from '../state'

const formatAmount = (amount: string, isExpense: boolean, currency: string) =>
  `${isExpense ? '-' : '+'}${amount}${getCurrencySymbol(currency)}`

const useStyles = makeStyles((theme: Theme) => ({
  listItem: {
    flexDirection: 'column',
    alignItems: 'start',
  },
  chipField: {
    overflow: 'auto',
    display: 'flex',
    width: '100%',
  },
  divider: {
    width: '100%',
    marginTop: theme.spacing(1),
    marginBottom: -theme.spacing(1),
  },
  listItemFirstRow: {
    display: 'flex',
    flex: 1,
    width: '100%',
  },
}))

const Transaction = (props: ListChildComponentProps) => {
  const { index, style } = props
  const classes = useStyles()
  // TODO: memoize
  const sortedTransactions = Object.values(
    useSelector((state: State) => state.transactions),
  ).sort((tx1, tx2) => tx1.dateTime.getTime() - tx2.dateTime.getTime())
  const tags = useSelector((state: State) => state.tags)
  const tx = sortedTransactions[index]

  return (
    <ListItem button style={style} key={index} className={classes.listItem}>
      <div className={classes.listItemFirstRow}>
        <ListItemText
          primary={
            <Typography
              variant="h4"
              style={{ color: tx.isExpense ? 'red' : 'green' }}
            >
              {formatAmount(tx.amount, tx.isExpense, tx.currency)}
            </Typography>
          }
        />
        <div style={{ margin: 'auto' }}>
          <Typography variant="body1" style={{ alignSelf: 'flex-end' }}>
            {`${formatDistance(tx.dateTime, new Date(), {
              includeSeconds: true,
            })} ago`}
          </Typography>
        </div>
      </div>
      <div className={classes.chipField}>
        {tx.tagIds.map((id) => (
          <Chip key={id} label={tags[id].name} onDelete={null as any} />
        ))}
      </div>
      <Divider className={classes.divider} />
    </ListItem>
  )
}

export default Transaction
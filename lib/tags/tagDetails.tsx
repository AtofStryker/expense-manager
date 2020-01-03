import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Paper from '@material-ui/core/Paper'
import { makeStyles, Theme } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import AutoIcon from '@material-ui/icons/BrightnessAuto'
import { map } from '@siegrift/tsfunct'
import classnames from 'classnames'
import format from 'date-fns/format'
import Router from 'next/router'
import React, { useState } from 'react'

import { Tag, Transaction } from '../addTransaction/state'
import AmountField from '../components/amountField'
import AppBar from '../components/appBar'
import { formatBoolean, isAmountInValidFormat } from '../shared/utils'

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    margin: theme.spacing(2),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  row: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  amount: { width: '100%' },
  paper: {
    padding: theme.spacing(2),
  },
  label: { width: '100%' },
}))

interface TagDetailsProps {
  appBarTitle: string
  tag: Tag
  onSave: (tag: Tag) => void
  onRemove?: () => void
  stats: {
    totalTxs: number
    moneyInvolvedInTxs: number
    latestTransaction: Transaction | null
    isRecurring: boolean
  }
}

const isValidDefaultAmount = (amount: string) => {
  return !amount || isAmountInValidFormat(amount)
}

interface UsageStatRowProps {
  label: string
  value: string | number | boolean
}

const UsageStatRow = ({ label, value }: UsageStatRowProps) => {
  return (
    <div style={{ display: 'flex', marginBottom: 2 }}>
      <Typography
        variant="body2"
        component="span"
        style={{ alignSelf: 'center', flex: 1 }}
      >
        {label}
      </Typography>
      <Typography variant="button" style={{ alignSelf: 'right' }}>
        {typeof value === 'boolean' ? formatBoolean(value) : value}
      </Typography>
    </div>
  )
}

const TagDetails = ({
  tag,
  stats,
  appBarTitle,
  onSave,
  onRemove,
}: TagDetailsProps) => {
  const classes = useStyles()

  const [tagName, setTagName] = useState(tag.name)
  const [isAutotag, setIsAutotag] = useState(tag.automatic)
  const [amount, setAmount] = useState(
    tag.defaultAmount ? tag.defaultAmount : '',
  )
  const [shouldValidate, setShouldValidate] = useState({
    tagName: false,
    amount: false,
  })
  const onRemoveTag = () => {
    onRemove!()
    Router.push('/tags')
  }

  return (
    <>
      <AppBar
        appBarTitle={appBarTitle}
        returnUrl={'/tags'}
        onSave={() => {
          if (isValidDefaultAmount(amount) && tagName) {
            onSave({
              ...tag,
              name: tagName,
              automatic: isAutotag,
              defaultAmount: amount,
            })
            Router.push('/tags')
          } else {
            // FIXME: tsfunct feature
            setShouldValidate(
              // @ts-ignore
              map(shouldValidate, (_, key) => ({
                key,
                value: true,
              })),
            )
          }
        }}
        onRemove={onRemove && onRemoveTag}
      />

      <div className={classes.root}>
        <Paper className={classes.paper}>
          <TextField fullWidth disabled label="Id" value={tag.id} />

          <TextField
            className={classes.row}
            fullWidth
            label="Tag name"
            value={tagName}
            onChange={(e) => {
              setShouldValidate((obj) => ({ ...obj, tagName: true }))
              setTagName(e.target.value)
            }}
            error={shouldValidate.tagName && tagName === ''}
          />

          <AmountField
            isValidAmount={isValidDefaultAmount}
            shouldValidateAmount={shouldValidate.amount}
            value={amount}
            onChange={(newAmount) => {
              setAmount(newAmount)
              setShouldValidate((obj) => ({ ...obj, amount: true }))
            }}
            label="Default transaction amount"
            className={classnames(classes.amount, classes.row)}
          />

          <FormControlLabel
            classes={{ root: classnames(classes.row), label: classes.label }}
            style={{ flex: 1, width: '100%' }}
            control={
              <Checkbox
                checked={isAutotag}
                onChange={() => setIsAutotag(!isAutotag)}
                value="checkedA"
                inputProps={{
                  'aria-label': 'primary checkbox',
                }}
              />
            }
            label={
              <div style={{ display: 'flex' }}>
                <Typography
                  variant="body2"
                  component="span"
                  style={{ alignSelf: 'center' }}
                >
                  Automatic tag
                </Typography>
                <AutoIcon style={{ marginLeft: 4 }} color="primary" />
              </div>
            }
          />
        </Paper>

        <Paper
          className={classnames(classes.paper, classes.row)}
          style={{ flexDirection: 'column' }}
        >
          <Typography color="textSecondary" gutterBottom variant="subtitle1">
            Usage stats
          </Typography>

          {/* TODO: icons */}
          <UsageStatRow label="Transaction occurences" value={stats.totalTxs} />
          <UsageStatRow
            label="Money involved"
            value={stats.moneyInvolvedInTxs}
          />
          <UsageStatRow
            label="In recurring transaction"
            value={stats.isRecurring}
          />
          <UsageStatRow
            label="Last used in transaction"
            value={
              stats.latestTransaction
                ? format(stats.latestTransaction.dateTime, 'dd/MM/yyyy')
                : 'never'
            }
          />
        </Paper>
      </div>
    </>
  )
}

export default TagDetails
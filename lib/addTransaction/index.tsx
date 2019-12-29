import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import Collapse from '@material-ui/core/Collapse'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Grid from '@material-ui/core/Grid'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'
import Select from '@material-ui/core/Select'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Switch from '@material-ui/core/Switch'
import TextField from '@material-ui/core/TextField'
import { DateTimePicker } from '@material-ui/pickers'
import { pick, set, update } from '@siegrift/tsfunct'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'uuid/v4'

import { setCurrentScreen } from '../../lib/actions'
import { useRedirectIfNotSignedIn } from '../../lib/shared/hooks'
import { State } from '../../lib/state'
import AmountField from '../components/amountField'
import { LoadingScreen } from '../components/loading'
import Navigation from '../components/navigation'
import TagField from '../components/tagField'
import { getCurrentUserId } from '../firebase/util'
import { currencies } from '../shared/currencies'
import { isAmountInValidFormat } from '../shared/utils'
import { addTransaction } from './actions'
import { automaticTagIdsSel } from './selectors'
import {
  AddTransaction as AddTransactionType,
  createDefaultAddTransactionState,
  RepeatingOption,
  RepeatingOptions,
  Tag,
} from './state'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      padding: theme.spacing(2),
    },
    chipField: { flex: 1 },
    amountInput: { marginLeft: theme.spacing(1) },
    row: {
      marginTop: '16px',
      display: 'flex',
      justifyContent: 'center',
      alignSelf: 'stretch',
    },
    amount: {
      display: 'flex',
      alignSelf: 'stretch',
    },
    currency: { width: 105, marginLeft: theme.spacing(2) },
    paper: {
      padding: theme.spacing(2),
    },
  }),
)

const allFieldsAreValid = (addTx: AddTransactionType) =>
  isAmountInValidFormat(addTx.amount)

const maybeApplyDefaultAmount = (tags: Tag[], amount: string) => {
  if (amount) return amount
  return tags.find((tag) => tag.defaultAmount)?.defaultAmount ?? amount
}

const AddTransaction = () => {
  const classes = useStyles()
  const dispatch = useDispatch()

  dispatch(setCurrentScreen('add'))

  const automaticTagIds = useSelector(automaticTagIdsSel)
  const [addTx, setAddTx] = useState(
    createDefaultAddTransactionState(automaticTagIds),
  )
  const {
    amount,
    currency,
    tagIds,
    newTags,
    tagInputValue,
    isExpense,
    note,
    dateTime,
    useCurrentTime,
    repeating,
    shouldValidateAmount,
  } = addTx

  const tags = useSelector((state: State) => state.tags)

  if (useRedirectIfNotSignedIn() !== 'loggedIn') {
    return <LoadingScreen />
  } else {
    return (
      <Grid
        container
        direction="column"
        justify="center"
        alignItems="center"
        className={classes.root}
      >
        <Paper className={classes.paper}>
          <Grid container className={classes.row}>
            <ButtonGroup variant="contained" fullWidth>
              <Button
                onClick={() =>
                  setAddTx((currAddTx) => set(currAddTx, ['isExpense'], true))
                }
                variant="contained"
                color={isExpense ? 'primary' : 'default'}
              >
                Expense
              </Button>
              <Button
                onClick={() =>
                  setAddTx((currAddTx) => set(currAddTx, ['isExpense'], false))
                }
                variant="contained"
                color={!isExpense ? 'primary' : 'default'}
              >
                Income
              </Button>
            </ButtonGroup>
          </Grid>

          <Grid className={classes.row}>
            <TagField
              placeholder="Transaction tags..."
              availableTags={tags}
              newTags={newTags}
              className={classes.chipField}
              onSelectExistingTag={(id) => {
                setAddTx((currAddTx) => {
                  const newAddTx = update(currAddTx, ['tagIds'], (ids) =>
                    // TODO: why we need this check?
                    ids.includes(id) ? ids : [...ids, id],
                  )
                  return update(newAddTx, ['amount'], (am) =>
                    maybeApplyDefaultAmount(
                      newAddTx.tagIds.map((i) => tags[i]),
                      am,
                    ),
                  )
                })
              }}
              onClearInputValue={() =>
                setAddTx((currAddTx) => set(currAddTx, ['tagInputValue'], ''))
              }
              onCreateTag={(tagName) => {
                if (tagName === '') {
                  return
                }

                const id = uuid()
                setAddTx((currAddTx) => ({
                  ...currAddTx,
                  tagIds: [...currAddTx.tagIds, id],
                  newTags: {
                    ...currAddTx.newTags,
                    [id]: {
                      id,
                      name: tagName,
                      uid: getCurrentUserId(),
                      automatic: false,
                    },
                  },
                  note: '',
                  tagInputValue: '',
                }))
              }}
              onChangeTags={(changedTags) => {
                const changedTagIds = changedTags.map((t) => t.id)
                setAddTx((currAddTx) => ({
                  ...currAddTx,
                  tagIds: changedTagIds,
                  newTags: pick(
                    currAddTx.newTags,
                    changedTagIds.filter((t) => !tags.hasOwnProperty(t)),
                  ),
                  amount: maybeApplyDefaultAmount(
                    changedTagIds.map((id) => tags[id]),
                    currAddTx.amount,
                  ),
                }))
              }}
              onSetTagInputValue={(newValue) =>
                setAddTx((currAddTx) =>
                  set(currAddTx, ['tagInputValue'], newValue),
                )
              }
              inputValue={tagInputValue}
              currentTagIds={tagIds}
            />
          </Grid>

          <Grid container className={classes.row}>
            <Grid item className={classes.amount}>
              <AmountField
                isValidAmount={isAmountInValidFormat}
                shouldValidateAmount={shouldValidateAmount}
                label="Transaction amount"
                value={amount}
                onChange={(newAmount) => {
                  setAddTx((currAddTx) => ({
                    ...currAddTx,
                    amount: newAmount,
                    shouldValidateAmount: true,
                  }))
                }}
              />

              <TextField
                select
                label="Currecy"
                value={currency}
                className={classes.currency}
                onChange={(e) => {
                  // NOTE: we need to save the value, because it might not exist when the callback is called
                  const value = e.target.value
                  setAddTx((currAddTx) => set(currAddTx, ['currency'], value))
                }}
              >
                {currencies.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid className={classes.row} style={{ justifyContent: 'start' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useCurrentTime}
                  onChange={() =>
                    setAddTx((currAddTx) => ({
                      ...currAddTx,
                      useCurrentTime: !useCurrentTime,
                      dateTime: !useCurrentTime ? new Date() : undefined,
                    }))
                  }
                  color="primary"
                />
              }
              label="Use current date and time"
            />
          </Grid>

          <Collapse in={!useCurrentTime}>
            <Grid className={classes.row}>
              <DateTimePicker
                autoOk
                ampm={false}
                disableFuture
                value={dateTime}
                onChange={(newDateTime) =>
                  setAddTx((currAddTx) =>
                    set(currAddTx, ['dateTime'], newDateTime as Date),
                  )
                }
                label="Transaction date"
                style={{ flex: 1 }}
              />
            </Grid>
          </Collapse>

          <Grid className={classes.row}>
            <FormControl style={{ flex: 1 }}>
              <InputLabel htmlFor="tx-repeating">Repeating</InputLabel>
              <Select
                value={repeating}
                onChange={(e) => {
                  // NOTE: we need to save the value, because it might not exist when the callback is called
                  const value = e.target.value
                  setAddTx((currAddTx) =>
                    set(currAddTx, ['repeating'], value as RepeatingOption),
                  )
                }}
                inputProps={{
                  name: 'repeating',
                  id: 'tx-repeating',
                }}
              >
                {Object.keys(RepeatingOptions)
                  .filter((op) => op !== RepeatingOptions.inactive)
                  .map((op) => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid className={classes.row}>
            <TextField
              fullWidth
              label="Additional note"
              value={note}
              onChange={(e) => {
                // NOTE: we need to save the value, because it might not exist when the callback is called
                const value = e.target.value
                setAddTx((currAddTx) => set(currAddTx, ['note'], value))
              }}
            />
          </Grid>

          <Grid className={classes.row}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                // some fields were not filled correctly. Show incorrect and return.
                if (!allFieldsAreValid(addTx)) {
                  setAddTx((currAddTx) =>
                    set(currAddTx, ['shouldValidateAmount'], true),
                  )
                  return
                }

                dispatch(addTransaction(addTx))
                setAddTx(createDefaultAddTransactionState(automaticTagIds))
              }}
              aria-label="add transaction"
            >
              Add transaction
            </Button>
          </Grid>
        </Paper>
        <Navigation />
      </Grid>
    )
  }
}

export default AddTransaction

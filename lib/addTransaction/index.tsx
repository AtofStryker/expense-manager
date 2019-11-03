import Button from '@material-ui/core/Button'
import ButtonGroup from '@material-ui/core/ButtonGroup'
import Collapse from '@material-ui/core/Collapse'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Grid from '@material-ui/core/Grid'
import Input from '@material-ui/core/Input'
import InputAdornment from '@material-ui/core/InputAdornment'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import Paper from '@material-ui/core/Paper'
import Select from '@material-ui/core/Select'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Switch from '@material-ui/core/Switch'
import TextField from '@material-ui/core/TextField'
import CancelIcon from '@material-ui/icons/Cancel'
import { DateTimePicker } from '@material-ui/pickers'
import { pick, set, update } from '@siegrift/tsfunct'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import uuid from 'uuid/v4'

import { setCurrentScreen } from '../../lib/actions'
import { useRedirectIfNotSignedIn } from '../../lib/shared/hooks'
import { State } from '../../lib/state'
import { LoadingScreen } from '../components/loading'
import Navigation from '../components/navigation'
import TagField from '../components/tagField'
import { getCurrentUserId } from '../firebase/util'
import { currencies } from '../shared/currencies'
import { isAmountInValidFormat } from '../shared/utils'

import { addTransaction } from './actions'
import { automaticTagIdsSel } from './selectors'
import {
  createDefaultAddTransactionState,
  AddTransaction as AddTransactionType,
  RepeatingOption,
  RepeatingOptions
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
                  // FIXME: tsfunct error
                  return update(currAddTx, ['tagIds'], (ids: any) =>
                    ids.includes(id) ? ids : [...ids, id],
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
                  note: 'adasdasd',
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
              <FormControl
                aria-label="amount"
                error={shouldValidateAmount && !allFieldsAreValid(addTx)}
              >
                <InputLabel htmlFor="amount-id">Transaction amount</InputLabel>
                <Input
                  id="amount-id"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) =>
                    setAddTx((currAddTx) => ({
                      ...currAddTx,
                      amount: e.target.value,
                      shouldValidateAmount: true,
                    }))
                  }
                  endAdornment={
                    <InputAdornment position="end">
                      <CancelIcon
                        color="primary"
                        onClick={() =>
                          setAddTx((currAddTx) => ({
                            ...currAddTx,
                            amount: '',
                            shouldValidateAmount: true,
                          }))
                        }
                        style={{ visibility: amount ? 'visible' : 'hidden' }}
                      />
                    </InputAdornment>
                  }
                />
              </FormControl>

              <TextField
                select
                label="Currecy"
                value={currency}
                className={classes.currency}
                onChange={(e) =>
                  setAddTx((currAddTx) =>
                    set(currAddTx, ['currency'], e.target.value),
                  )
                }
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
                onChange={(e) =>
                  setAddTx((currAddTx) =>
                    set(currAddTx, ['repeating'], e.target
                      .value as RepeatingOption),
                  )
                }
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
              onChange={(e) =>
                setAddTx((currAddTx) => set(currAddTx, ['note'], e.target.value))
              }
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

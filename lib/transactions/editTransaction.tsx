import { useState } from 'react'

import { Theme } from '@mui/material'
import { pick } from '@siegrift/tsfunct'
import difference from 'lodash/difference'
import { FileObject } from 'mui-file-dropzone'
import Router, { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import { ObjectOf } from '../../lib/types'
import { Tag, Transaction } from '../addTransaction/state'
import AppBar from '../components/appBar'
import ConfirmDialog from '../components/confirmDialog'
import TransactionForm from '../components/transactionForm'
import { createErrorNotification, setSnackbarNotification } from '../shared/actions'
import { INVALID_TRANSACTION_FORM_FIELDS } from '../shared/constants'
import { isAmountInValidFormat } from '../shared/utils'

import { removeTx, saveTxEdit } from './actions'
import { transactionByIdSel, tagsSel, previousTxSel } from './selectors'

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    margin: theme.spacing(2),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  chipField: { flex: 1 },
  amountInput: { marginLeft: theme.spacing(1) },
  row: {
    display: 'flex',
    alignSelf: 'stretch',
  },
  paper: {
    '& > *:not(:first-of-type)': {
      marginTop: theme.spacing(2),
    },
  },
  amount: {
    display: 'flex',
    alignSelf: 'stretch',
    // for desktop
    flex: 1,
  },
  currency: { width: 105, marginLeft: theme.spacing(2) },
}))

interface EditTransactionContentProps {
  tx: Transaction
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const emptyFunction = () => {}

const EditTransactionContent = ({ tx }: EditTransactionContentProps) => {
  const { classes } = useStyles()
  const dispatch = useDispatch()
  const availableTags = useSelector(tagsSel)
  const previousTx = useSelector(previousTxSel(tx.id))

  const [amount, setAmount] = useState('' + tx.amount)
  const [type, setType] = useState(tx.type)
  const [note, setNote] = useState(tx.note)
  const [currency, setCurrency] = useState(tx.currency)
  const [dateTime, setDateTime] = useState(tx.dateTime)
  const [repeating, setRepeating] = useState(tx.repeating)
  const [tagIds, setTagIds] = useState(tx.tagIds)
  const [newTags, setNewTags] = useState<ObjectOf<Tag>>({})
  const [tagInputValue, setTagInputValue] = useState('')
  const [shouldValidate, setShouldValidate] = useState(false)
  const [showTxRemoveDialog, setShowTxRemoveDialog] = useState(false)
  const [attachedFileObjects, setAttachedFileObjects] = useState<FileObject[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(tx.attachedFiles ?? [])

  const onSaveHandler = (e: React.SyntheticEvent) => {
    e.stopPropagation()

    if (isAmountInValidFormat(amount)) {
      dispatch(
        saveTxEdit(
          newTags,
          attachedFileObjects.map((f) => f.file),
          {
            id: tx.id,
            amount: Number.parseFloat(amount),
            type,
            note,
            currency,
            dateTime,
            tagIds,
            repeating,
            attachedFiles: uploadedFiles,
          }
        )
      )

      Router.push(`/transactions#${tx.id}`)
    } else {
      setShouldValidate(true)
      dispatch(setSnackbarNotification(createErrorNotification(INVALID_TRANSACTION_FORM_FIELDS)))
    }
  }

  return (
    <>
      <AppBar
        returnUrl={`/transactions#${tx.id}`}
        onSave={onSaveHandler}
        onRemove={(e) => {
          e.stopPropagation()

          setShowTxRemoveDialog(true)
        }}
        appBarTitle="Edit transaction"
      />
      <div className={classes.root}>
        <TransactionForm
          variant="edit"
          type={{
            value: type,
            handler: setType,
          }}
          tagProps={{
            tags: { ...availableTags, ...newTags },
            currentTagIds: tagIds,
            onSelectTag: (id) => {
              tagIds.length >= 2 && type === 'transfer' ? emptyFunction : setTagIds([...tagIds, id])
            },
            onCreateTag: (tag) => {
              tagIds.length >= 2 && type === 'transfer'
                ? emptyFunction
                : setNewTags({
                    ...newTags,
                    [tag.id]: tag,
                  })
              tagIds.length >= 2 && type === 'transfer' ? emptyFunction : setTagIds([...tagIds, tag.id])
            },
            onRemoveTags: (removeTagIds) => {
              const ids = difference(tagIds, removeTagIds)
              setTagIds(ids)
              setNewTags(
                pick(
                  newTags,
                  ids.filter((id) => availableTags[id] == null)
                )
              )
            },
            value: tagInputValue,
            onValueChange: (newValue) => setTagInputValue(newValue),
          }}
          amount={{
            value: amount,
            handler: (newAmount) => {
              setShouldValidate(true)
              setAmount(newAmount)
            },
            isValid: isAmountInValidFormat,
            validate: shouldValidate,
          }}
          currency={{ value: currency, handler: setCurrency }}
          dateTime={{ value: dateTime, handler: (dt) => setDateTime(dt!) }}
          repeating={{ value: repeating, handler: setRepeating }}
          note={{ value: note, handler: setNote }}
          attachedFileObjects={{
            value: attachedFileObjects,
            handler: setAttachedFileObjects,
          }}
          uploadedFiles={{
            value: uploadedFiles,
            handler: setUploadedFiles,
          }}
          id={tx.id}
          onSubmit={onSaveHandler}
        />
      </div>
      {showTxRemoveDialog && (
        <ConfirmDialog
          onConfirm={(e) => {
            e.stopPropagation()

            dispatch(removeTx(tx.id))
            const returnUrl = previousTx ? `/transactions#${previousTx.id}` : '/transactions'
            Router.push(returnUrl)
          }}
          onCancel={() => setShowTxRemoveDialog(false)}
          title="Do you really want to remove this transacation?"
          open={true}
          ContentComponent="You won't be able to undo this action"
        />
      )}
    </>
  )
}

const EditTransaction = () => {
  const router = useRouter()
  const reduxTx = useSelector(transactionByIdSel(router.query.id as string))

  if (!reduxTx) return null
  return <EditTransactionContent tx={reduxTx} />
}

export default EditTransaction

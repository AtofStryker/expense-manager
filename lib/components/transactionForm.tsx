import { SyntheticEvent, useState } from 'react'

import { css } from '@emotion/react'
import CloseIcon from '@mui/icons-material/Cancel'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import {
  Button,
  ButtonGroup,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  ListSubheader,
  MenuItem,
  Select,
  Theme,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker, TimePicker } from '@mui/x-date-pickers'
import { addDays, addMinutes, getMinutes, setMinutes, subDays, subMinutes } from 'date-fns'
import { getDownloadURL, getMetadata, getStorage, ref } from 'firebase/storage'
import { DropzoneAreaBase, FileObject } from 'mui-file-dropzone'
import Highlight from 'react-highlight.js'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import { RepeatingOption, RepeatingOptions, Tag } from '../addTransaction/state'
import AmountField from '../components/amountField'
import { Loading } from '../components/loading'
import Paper from '../components/paper'
import TagField from '../components/tagField'
import { formatStoragePath } from '../firebase/firestore'
import { setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { DEFAULT_DATE_FORMAT, DEFAULT_TIME_FORMAT } from '../shared/constants'
import { Currency, CURRENCIES } from '../shared/currencies'
import { useFirebaseLoaded } from '../shared/hooks'
import { mainCurrencySel, exchangeRatesSel, currentUserIdSel } from '../shared/selectors'
import { useRefreshExchangeRates } from '../shared/transaction/useRefreshExchangeRates'
import { areDistinct, computeExchangeRate, downloadTextFromUrl } from '../shared/utils'
import { ObjectOf } from '../types'

import CurrencySelect from './currencySelect'
import HotkeyLabel from './hotkeyLabel'

const useStyles = makeStyles()((theme: Theme) => ({
  row: {
    display: 'flex',
    alignSelf: 'stretch',
  },
  paper: {
    '& > *:not(:first-of-type)': {
      marginTop: theme.spacing(2),
    },
  },
  currency: { width: 105, marginLeft: theme.spacing(2) },
  time: { marginLeft: theme.spacing(2) },
  startAdornment: {
    '& .MuiSvgIcon-root': { color: theme.palette.primary.main },
    '& .MuiButtonBase-root': { padding: 4, margin: 0, marginLeft: -14 },
  },
  endAdornment: {
    display: 'flex',
    alignItems: 'center',
    '& > *:not(:first-of-type)': { marginLeft: theme.spacing(0.5) },
  },
  dropzoneText: {
    fontSize: theme.typography.body1.fontSize,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1.5),
    display: 'inline-block',
    verticalAlign: 'top',
    marginRight: 8,
  },
  dropzone: { minHeight: 0 },
  dropzoneIcon: { width: 25, height: 25, marginTop: 8 },
  dropzonePreviewItemDeleteIcon: { opacity: '1 !important' },
  showFileDialogPaper: { width: '100%', maxWidth: 'unset' },
}))

type FieldProps<T> = {
  value: T
  handler: (newValue: T) => void
}
type FieldPropsWithValidation<T> = FieldProps<T> & {
  isValid: (value: T) => boolean
  validate: boolean
}

interface BaseProps {
  type: FieldProps<'expense' | 'income' | 'transfer'>
  tagProps: {
    tags: ObjectOf<Tag>
    currentTagIds: string[]
    onSelectTag: (id: string) => void
    onCreateTag: (tag: Tag) => void
    onRemoveTags: (tagIds: string[]) => void
    value: string
    onValueChange: (newValue: string) => void
  }
  amount: FieldPropsWithValidation<string>
  currency: FieldProps<Currency>
  dateTime: FieldProps<Date | undefined | null>
  repeating: FieldProps<RepeatingOption>
  note: FieldProps<string>
  attachedFileObjects: FieldProps<FileObject[]>
  onSubmit: (e: SyntheticEvent) => void
}

type AddTxFormVariantProps = {
  variant: 'add'
}

type EditTxFormVariantProps = {
  variant: 'edit'
  uploadedFiles: FieldProps<string[]>
  id: string
}

type VariantProps = AddTxFormVariantProps | EditTxFormVariantProps

type TransactionFormProps = BaseProps & VariantProps

interface ShowFileContent {
  filename: string
  rawContent?: string
  url?: string
  isImage?: boolean
}

const FileContent = ({ rawContent, url, filename, isImage }: ShowFileContent) => {
  if (!url) return <>Loading...</>

  if (isImage) {
    return (
      // We are not using the Image component from next.js because the domain from which the image is loaded needs to be
      // whitelisted in the next.config.js file and it needs to support sending the image with different resolutions.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={filename}
        // The image is user uploaded and we don't know its size and aspect ratio so we can't set the width and height
        // attributes. Instead, we display the image in its original size and let the browser scale it down to fit the
        // container.
        css={css`
          object-fit: scale-down;
          max-width: 100%;
          max-height: 100%;
        `}
      />
    )
  }

  const suffix = filename.includes('.') ? filename.substring(filename.lastIndexOf('.') + 1).toLowerCase() : null

  switch (suffix) {
    case 'html':
    case 'htm':
      return (
        <iframe
          srcDoc={rawContent}
          css={css`
            width: 100%;
            height: 60vh;
          `}
        ></iframe>
      )
    case 'json':
    case 'txt':
      return <Highlight language={suffix}>{rawContent}</Highlight>
    default:
      return (
        <Button variant="contained" fullWidth color="primary" href={url} rel="noopener noreferrer" target="_blank">
          Download
        </Button>
      )
  }
}

const TransactionForm = (props: TransactionFormProps) => {
  const { variant, tagProps, type, amount, currency, dateTime, onSubmit, repeating, note, attachedFileObjects } = props
  const uploadedFiles = variant === 'edit' && (props as EditTxFormVariantProps).uploadedFiles
  const txId = variant === 'edit' && (props as EditTxFormVariantProps).id

  const { classes } = useStyles()

  const mainCurrency = useSelector(mainCurrencySel)
  const exchangeRates = useSelector(exchangeRatesSel)
  const userId = useSelector(currentUserIdSel)
  const settingsLoaded = useFirebaseLoaded()
  const dispatch = useDispatch()
  const [showUploadedFile, setShowUploadedFile] = useState<null | ShowFileContent>(null)

  const { loading, error } = useRefreshExchangeRates()

  let filteredRepeatingOptions = Object.keys(RepeatingOptions)
  if (variant === 'add') {
    filteredRepeatingOptions = filteredRepeatingOptions.filter((op) => op !== RepeatingOptions.inactive)
  }

  return (
    <Paper className={classes.paper}>
      <Grid container className={classes.row}>
        <ButtonGroup variant="contained" fullWidth color="grey">
          <Button
            onClick={() => type.handler('expense')}
            variant="contained"
            color={type.value === 'expense' ? 'primary' : 'grey'}
          >
            Expense
          </Button>
          <Button
            onClick={() => type.handler('income')}
            variant="contained"
            color={type.value === 'income' ? 'primary' : 'grey'}
          >
            Income
          </Button>
          <Button
            onClick={() => {
              type.handler('transfer')
              const redundantTagIds = tagProps.currentTagIds.slice(2)
              tagProps.onRemoveTags(redundantTagIds)
            }}
            variant="contained"
            color={type.value === 'transfer' ? 'primary' : 'grey'}
          >
            Transfer
          </Button>
        </ButtonGroup>
      </Grid>

      <Grid className={classes.row}>
        <TagField
          tags={tagProps.tags}
          onSelectTag={tagProps.onSelectTag}
          onCreateTag={tagProps.onCreateTag}
          onSetTagInputValue={tagProps.onValueChange}
          onRemoveTags={tagProps.onRemoveTags}
          inputValue={tagProps.value}
          currentTagIds={tagProps.currentTagIds}
        />
      </Grid>

      <Grid container className={classes.row}>
        <AmountField
          type={type.value}
          setTransactionType={type.handler}
          currency={CURRENCIES[currency.value]}
          isValidAmount={amount.isValid}
          shouldValidateAmount={amount.validate}
          label="Amount"
          value={amount.value}
          onChange={amount.handler}
          onPressEnter={onSubmit}
        />

        <CurrencySelect value={currency.value} className={classes.currency} onChange={currency.handler} />
      </Grid>

      <Collapse
        in={currency.value !== mainCurrency}
        css={css`
          // Needed because the parent selector is too specific and adds padding for every paper child element.
          margin-top: 0 !important;
        `}
      >
        <Grid
          className={classes.row}
          css={css`
            flex-wrap: wrap;
          `}
        >
          {settingsLoaded && (
            <>
              <Typography variant="caption">
                {(parseFloat(amount.value) || 0).toFixed(CURRENCIES[currency.value].scale)} {currency.value}
                {' = '}
                <b>
                  {(
                    (parseFloat(amount.value) || 0) *
                    computeExchangeRate(exchangeRates!.rates, currency.value, mainCurrency!)
                  ).toFixed(CURRENCIES[mainCurrency!].scale)}{' '}
                  {mainCurrency}
                </b>
              </Typography>
              <Typography
                variant="caption"
                css={css`
                  margin-left: 8;
                `}
              >
                <i>(rates from {exchangeRates!.date})</i>
              </Typography>
            </>
          )}
          {loading && (
            <Typography variant="caption">
              <Loading
                size={15}
                cssOverrides={{
                  image: css`
                    display: inline;
                    margin-top: 2px;
                  `,
                }}
              />
              <span
                css={css`
                  margin-left: 4px;
                  vertical-align: super;
                `}
              >
                Loading fresh exchange rates
              </span>
            </Typography>
          )}
          {error && (
            <Typography
              variant="caption"
              css={css`
                color: red;
              `}
            >
              <ErrorOutlineIcon fontSize="small" />
              <span
                css={css`
                  margin-left: 4px;
                  vertical-align: super;
                `}
              >
                Couldn't refresh exchange rates
              </span>
            </Typography>
          )}
        </Grid>
      </Collapse>

      <Grid className={classes.row}>
        <TextField
          fullWidth
          label="Note"
          value={note.value}
          placeholder="Write something down..."
          InputLabelProps={{ shrink: true }}
          onChange={(e) => note.handler(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit(e)
          }}
        />
      </Grid>

      <Grid className={classes.row}>
        <DatePicker
          inputFormat={DEFAULT_DATE_FORMAT}
          disableFuture
          value={dateTime.value}
          onChange={dateTime.handler}
          label="Date"
          renderInput={(props) => (
            <TextField
              {...props}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <div className={classes.startAdornment}>{props.InputProps?.endAdornment}</div>,
                endAdornment: (
                  <div className={classes.endAdornment}>
                    <HotkeyLabel size="small" hotkey="↑" />
                    <HotkeyLabel size="small" hotkey="↓" />
                  </div>
                ),
              }}
              css={css`
                flex: 1;
              `}
              onKeyDown={(e) => {
                if (!dateTime.value) return
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  return onSubmit(e)
                }

                switch (e.key) {
                  case 'ArrowUp':
                    e.preventDefault()
                    e.stopPropagation()
                    dateTime.handler(addDays(dateTime.value, 1))
                    break
                  case 'ArrowDown':
                    e.preventDefault()
                    e.stopPropagation()
                    dateTime.handler(subDays(dateTime.value, 1))
                    break
                  default:
                    break
                }
              }}
            />
          )}
        />
        <TimePicker
          className={classes.time}
          inputFormat={DEFAULT_TIME_FORMAT}
          value={dateTime.value}
          onChange={dateTime.handler}
          label="Time"
          renderInput={(props) => (
            <TextField
              {...props}
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: <div className={classes.startAdornment}>{props.InputProps?.endAdornment}</div>,
                endAdornment: (
                  <div className={classes.endAdornment}>
                    <HotkeyLabel size="small" hotkey="↑" />
                    <HotkeyLabel size="small" hotkey="↓" />
                  </div>
                ),
              }}
              css={css`
                flex: 1;
              `}
              onKeyDown={(e) => {
                if (!dateTime.value) return
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  return onSubmit(e)
                }

                const minutesAddition = 15
                const roundMinutes = (date: Date) => {
                  const minutes = getMinutes(date)
                  return setMinutes(date, minutesAddition * Math.floor(minutes / minutesAddition))
                }

                switch (e.key) {
                  case 'ArrowUp':
                    e.preventDefault()
                    e.stopPropagation()
                    dateTime.handler(addMinutes(roundMinutes(dateTime.value), minutesAddition))
                    break
                  case 'ArrowDown':
                    e.preventDefault()
                    e.stopPropagation()
                    dateTime.handler(subMinutes(roundMinutes(dateTime.value), minutesAddition))
                    break
                  default:
                    break
                }
              }}
            />
          )}
        />
      </Grid>

      <Grid className={classes.row}>
        <FormControl fullWidth>
          <InputLabel htmlFor="tx-repeating">Repeating</InputLabel>
          <Select
            value={repeating.value}
            onChange={(e) => repeating.handler(e.target.value as RepeatingOption)}
            inputProps={{
              name: 'repeating',
              id: 'tx-repeating',
            }}
          >
            {filteredRepeatingOptions.map((op) => (
              <MenuItem key={op} value={op}>
                {op}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {uploadedFiles && (
        <List
          dense
          subheader={
            <ListSubheader
              css={css`
                padding: 0;
                font-size: small;
              `}
            >
              Already uploaded files
            </ListSubheader>
          }
        >
          {uploadedFiles.value.map((filename) => (
            <ListItemButton
              key={filename}
              onClick={async () => {
                setShowUploadedFile({ filename })
                const success = await withErrorHandler('Unable to download file content', dispatch, async () => {
                  const storageRef = ref(getStorage(), formatStoragePath(userId!, 'files', txId as string, filename))
                  const url = await getDownloadURL(storageRef)

                  const type = (await getMetadata(storageRef))?.contentType
                  if (typeof type === 'string' && type.startsWith('image')) {
                    setShowUploadedFile({ filename, url, isImage: true })
                    return true
                  }

                  const rawContent = await downloadTextFromUrl(url)
                  setShowUploadedFile({ filename, rawContent, url })
                  return true /* success */
                })

                if (!success)
                  setShowUploadedFile({
                    filename,
                    rawContent: 'Unexpected error while downloading file!',
                  })
              }}
            >
              <ListItemText primary={filename} />
              <ListItemSecondaryAction
                css={css`
                  right: 0;
                `}
              >
                <IconButton
                  color="primary"
                  onClick={() => uploadedFiles.handler(uploadedFiles.value.filter((f) => f !== filename))}
                >
                  <CloseIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItemButton>
          ))}
        </List>
      )}

      {showUploadedFile && (
        <Dialog onClose={() => setShowUploadedFile(null)} open={true} classes={{ paper: classes.showFileDialogPaper }}>
          <DialogTitle>{`Attached file - ${showUploadedFile.filename}`}</DialogTitle>
          <DialogContent dividers>
            <FileContent {...showUploadedFile} />
          </DialogContent>
          <DialogActions>
            <Button autoFocus onClick={() => setShowUploadedFile(null)} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <DropzoneAreaBase
        showPreviews={true}
        showPreviewsInDropzone={false}
        useChipsForPreview
        previewText={''}
        // Max file size is 30MB (the default is 3MB)
        maxFileSize={30 * 1024 * 1024}
        previewChipProps={{
          variant: 'filled',
          classes: { deleteIcon: classes.dropzonePreviewItemDeleteIcon },
        }}
        filesLimit={5}
        fileObjects={attachedFileObjects.value}
        onAdd={(newFileObjects) => {
          let filenames = newFileObjects.map((f) => f.file.name)
          if (uploadedFiles) {
            filenames = filenames.concat(uploadedFiles.value)
          }

          if (!areDistinct(filenames)) {
            dispatch(
              setSnackbarNotification({
                message: 'Detected multiple files with same filenames!',
                severity: 'warning',
              })
            )
          } else {
            attachedFileObjects.handler([...attachedFileObjects.value, ...newFileObjects])
          }
        }}
        onDelete={(_fileObj, index) =>
          attachedFileObjects.handler(attachedFileObjects.value.filter((_, i) => i !== index))
        }
        showAlerts={false}
        classes={{
          text: classes.dropzoneText,
          icon: classes.dropzoneIcon,
          root: classes.dropzone,
        }}
        dropzoneText="Drag and drop file(s) or click to choose"
        onAlert={(message, severity) => {
          if (severity === 'error') dispatch(setSnackbarNotification({ message, severity }))
        }}
      />

      {variant === 'add' && (
        <Grid className={classes.row}>
          <Button variant="contained" color="primary" fullWidth onClick={onSubmit} aria-label="add transaction">
            Add transaction
          </Button>
        </Grid>
      )}
    </Paper>
  )
}

export default TransactionForm

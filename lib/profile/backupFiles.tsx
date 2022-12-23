import { useEffect, useState } from 'react'

import { css } from '@emotion/react'
import BackupIcon from '@mui/icons-material/Backup'
import UnselectAllIcon from '@mui/icons-material/ClearAll'
import DeleteIcon from '@mui/icons-material/Delete'
import SelectAllIcon from '@mui/icons-material/DoneAll'
import DownloadIcon from '@mui/icons-material/GetApp'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItemButton,
  ListItemSecondaryAction,
  ListItemText,
  Theme,
} from '@mui/material'
import { update } from '@siegrift/tsfunct'
import Highlight from 'react-highlight.js'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import ConfirmDialog from '../components/confirmDialog'
import Loading from '../components/loading'
import { createErrorNotification, setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { DOWNLOADING_DATA_ERROR } from '../shared/constants'
import { currentUserIdSel, firebaseLoadedSel } from '../shared/selectors'

import { uploadBackup, removeBackupFiles } from './backupActions'
import {
  AUTO_BACKUP_PERIOD_DAYS,
  createBackupFilename,
  downloadBackupFiles,
  backupFileContent,
  listBackupFilesForUser,
} from './backupCommons'

const useStyles = makeStyles()((theme: Theme) => ({
  buttonsWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  buttons: {
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  showFileDialogPaper: {
    width: '100%',
    maxWidth: 'unset',
  },
}))

interface ListItemData {
  filename: string
  checked: boolean
}

interface ShowFileContent {
  filename: string
  content: string | null | undefined
}

const BackupFilesList = () => {
  const { classes } = useStyles()
  const [listItems, setListItems] = useState<ListItemData[] | null | undefined>(undefined)
  const firebaseLoaded = useSelector(firebaseLoadedSel)
  const userId = useSelector(currentUserIdSel)
  const dispatch = useDispatch()
  const [showRemoveFileDialog, setShowRemoveFileDialog] = useState(false)
  const [showFile, setShowFile] = useState<ShowFileContent | null>(null)

  const somethingSelected = !!listItems && !listItems.find((i) => i.checked)

  const handleToggle = (index: number) => () => {
    setListItems(update(listItems!, [index, 'checked'], (val) => !val))
  }

  useEffect(() => {
    if (!firebaseLoaded) return
    setListItems(null)

    const performAsyncCall = async () => {
      const data = await withErrorHandler(DOWNLOADING_DATA_ERROR, dispatch, () => listBackupFilesForUser(userId!))

      if (!data) return
      else if (typeof data === 'string') dispatch(setSnackbarNotification(createErrorNotification(data)))
      else {
        setListItems(data.map((str) => ({ filename: str, checked: false })))
      }
    }

    performAsyncCall()
  }, [dispatch, firebaseLoaded, userId])

  if (!firebaseLoaded || listItems === undefined) return null
  else if (listItems === null)
    return (
      <Loading
        size={100}
        text="Loading backup files..."
        cssOverrides={{
          text: css`
            font-size: 2em;
          `,
        }}
      />
    )
  else {
    return (
      <>
        <List dense>
          {listItems.map(({ filename, checked }, index) => {
            return (
              <ListItemButton
                key={filename}
                onClick={async () => {
                  setShowFile({ filename, content: undefined })
                  const success = await withErrorHandler('Unable to download file content', dispatch, async () => {
                    const content = await backupFileContent(userId!, filename)

                    setShowFile({ filename, content })
                    return true /* success */
                  })

                  if (!success) setShowFile({ filename, content: null })
                }}
              >
                <ListItemText primary={filename} />
                <ListItemSecondaryAction>
                  <Checkbox edge="end" onChange={handleToggle(index)} checked={checked} />
                </ListItemSecondaryAction>
              </ListItemButton>
            )
          })}
          <Divider />

          <div className={classes.buttonsWrapper}>
            <div className={classes.buttons}>
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<SelectAllIcon />}
                onClick={() => {
                  const firstInd = listItems.findIndex((item) => item.checked)
                  setListItems(listItems.map((item, i) => (i < firstInd ? item : { ...item, checked: true })))
                }}
                disabled={somethingSelected}
              >
                Select older
              </Button>
              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<UnselectAllIcon />}
                onClick={() => {
                  setListItems(listItems.map((item) => ({ ...item, checked: false })))
                }}
                disabled={somethingSelected}
              >
                Unselect all
              </Button>

              <Button
                size="small"
                color="primary"
                variant="outlined"
                startIcon={<BackupIcon />}
                onClick={() => {
                  const filename = createBackupFilename()

                  dispatch(uploadBackup(filename))
                  setListItems([{ filename, checked: false }, ...listItems])
                }}
              >
                Backup now
              </Button>
            </div>

            <div className={classes.buttons}>
              <Button
                size="small"
                color="secondary"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={() => setShowRemoveFileDialog(true)}
                disabled={somethingSelected}
              >
                Remove
              </Button>
              <Button
                size="small"
                color="primary"
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() =>
                  downloadBackupFiles(
                    userId!,
                    listItems.filter((i) => i.checked).map((i) => i.filename)
                  )
                }
                disabled={somethingSelected}
              >
                Download
              </Button>
            </div>
          </div>
        </List>

        <ConfirmDialog
          onConfirm={async (e) => {
            e.stopPropagation()

            const filenames = listItems.filter(({ checked }) => checked).map(({ filename }) => filename)

            await dispatch(removeBackupFiles(filenames))

            // delete the removed ones from state
            const preserved = listItems.filter(({ checked }) => !checked)
            setListItems(preserved)

            setShowRemoveFileDialog(false)
          }}
          onCancel={() => setShowRemoveFileDialog(false)}
          title="Do you really want to remove this file(s)?"
          open={showRemoveFileDialog}
          ContentComponent="You won't be able to undo this action"
        />

        {showFile && (
          <Dialog onClose={() => setShowFile(null)} open={true} classes={{ paper: classes.showFileDialogPaper }}>
            <DialogTitle>{`Backup - ${showFile.filename}`}</DialogTitle>
            <DialogContent dividers>
              <Highlight language="json">{showFile.content ?? 'Loading...'}</Highlight>
            </DialogContent>
            <DialogActions>
              <Button autoFocus onClick={() => setShowFile(null)} color="primary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </>
    )
  }
}

const BackupFiles = () => {
  return (
    <>
      {/* TODO: create section for attached files download */}
      <Alert
        severity="info"
        css={css`
          margin-bottom: 8px;
          text-transform: initial;
        `}
      >
        Data is automatically saved every <b>{AUTO_BACKUP_PERIOD_DAYS} days</b>{' '}
        <i>(maybe more if there are no changes in the data)</i>.
      </Alert>
      <BackupFilesList />
    </>
  )
}

export default BackupFiles

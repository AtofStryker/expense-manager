import React from 'react'

import Button from '@material-ui/core/Button'
import Checkbox from '@material-ui/core/Checkbox'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Divider from '@material-ui/core/Divider'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction'
import ListItemText from '@material-ui/core/ListItemText'
import { makeStyles, Theme } from '@material-ui/core/styles'
import BackupIcon from '@material-ui/icons/Backup'
import UnselectAllIcon from '@material-ui/icons/ClearAll'
import DeleteIcon from '@material-ui/icons/Delete'
import SelectAllIcon from '@material-ui/icons/DoneAll'
import DownloadIcon from '@material-ui/icons/GetApp'
import Alert from '@material-ui/lab/Alert'
import { update } from '@siegrift/tsfunct'
import Highlight from 'react-highlight.js'
import { useDispatch, useSelector } from 'react-redux'

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

const useStyles = makeStyles((theme: Theme) => ({
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
  const classes = useStyles()
  const [listItems, setListItems] = React.useState<ListItemData[] | null | undefined>(undefined)
  const firebaseLoaded = useSelector(firebaseLoadedSel)
  const userId = useSelector(currentUserIdSel)
  const dispatch = useDispatch()
  const [showRemoveFileDialog, setShowRemoveFileDialog] = React.useState(false)
  const [showFile, setShowFile] = React.useState<ShowFileContent | null>(null)

  const somethingSelected = !!listItems && !listItems.find((i) => i.checked)

  const handleToggle = (index: number) => () => {
    setListItems(update(listItems!, [index, 'checked'], (val) => !val))
  }

  React.useEffect(() => {
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
  }, [firebaseLoaded])

  if (!firebaseLoaded || listItems === undefined) return null
  else if (listItems === null)
    return <Loading size={100} text="Loading backup files..." textStyle={{ fontSize: '2.0em' }} />
  else {
    return (
      <>
        <List dense>
          {listItems.map(({ filename, checked }, index) => {
            return (
              <ListItem
                key={filename}
                button
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
              </ListItem>
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
      <Alert severity="info" style={{ marginBottom: 8, textTransform: 'initial' }}>
        Data is automatically saved every <b>{AUTO_BACKUP_PERIOD_DAYS} days</b>{' '}
        <i>(maybe more if there are no changes in the data)</i>.
      </Alert>
      <BackupFilesList />
    </>
  )
}

export default BackupFiles

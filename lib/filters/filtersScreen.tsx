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
import Paper from '@material-ui/core/Paper'
import { makeStyles, Theme } from '@material-ui/core/styles'
import CreateNewIcon from '@material-ui/icons/AddCircleOutline'
import UnselectAllIcon from '@material-ui/icons/ClearAll'
import DeleteIcon from '@material-ui/icons/Delete'
import EditIcon from '@material-ui/icons/Edit'
import { update } from '@siegrift/tsfunct'
import Link from 'next/link'
import Highlight from 'react-highlight.js'
import { useDispatch, useSelector } from 'react-redux'

import ConfirmDialog from '../components/confirmDialog'
import Loading from '../components/loading'
import PageWrapper from '../components/pageWrapper'
import { createErrorNotification, setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { DOWNLOADING_DATA_ERROR } from '../shared/constants'
import { currentUserIdSel, firebaseLoadedSel } from '../shared/selectors'

import { removeFilters } from './actions'
import { filterFileContent, listFiltersForUser } from './filterCommons'

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

const FilterFiles = () => {
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
      const data = await withErrorHandler(DOWNLOADING_DATA_ERROR, dispatch, () => listFiltersForUser(userId!))

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
    return <Loading size={100} text="Loading filter files..." textStyle={{ fontSize: '2.0em' }} />
  else {
    return (
      <>
        <List dense>
          {!listItems.length && (
            <Paper style={{ minHeight: 200, display: 'flex' }}>
              <span style={{ margin: 'auto' }}>You have no filters created</span>
            </Paper>
          )}
          {listItems.map(({ filename, checked }, index) => {
            return (
              <ListItem
                key={filename}
                button
                onClick={async () => {
                  setShowFile({ filename, content: undefined })
                  const success = await withErrorHandler('Unable to download file content', dispatch, async () => {
                    const content = await filterFileContent(userId!, filename)

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
                color="secondary"
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={() => setShowRemoveFileDialog(true)}
                disabled={somethingSelected}
              >
                Remove
              </Button>
            </div>

            <div className={classes.buttons}>
              <Link href="/filters/create">
                <Button size="small" color="primary" variant="outlined" startIcon={<CreateNewIcon />}>
                  Create new
                </Button>
              </Link>
            </div>
          </div>
        </List>

        <ConfirmDialog
          onConfirm={async (e) => {
            e.stopPropagation()

            const filenames = listItems.filter(({ checked }) => checked).map(({ filename }) => filename)

            await dispatch(removeFilters(filenames))

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
            <DialogTitle>{`Filter - ${showFile.filename}`}</DialogTitle>
            <DialogContent dividers>
              <Highlight language="javascript">{showFile.content ?? 'Loading...'}</Highlight>
            </DialogContent>
            <DialogActions>
              <Link href={`/filters/edit?name=${showFile.filename}`}>
                <Button color="primary" startIcon={<EditIcon color="primary" />}>
                  Edit
                </Button>
              </Link>
              <Button autoFocus onClick={() => setShowFile(null)} color="secondary">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        )}
      </>
    )
  }
}

const FilterScreen = () => {
  return (
    <PageWrapper>
      <FilterFiles />
    </PageWrapper>
  )
}

export default FilterScreen

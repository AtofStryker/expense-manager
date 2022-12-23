import { useEffect, useState } from 'react'

import { css } from '@emotion/react'
import CreateNewIcon from '@mui/icons-material/AddCircleOutline'
import UnselectAllIcon from '@mui/icons-material/ClearAll'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import {
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
  Paper,
  Theme,
} from '@mui/material'
import { update } from '@siegrift/tsfunct'
import Link from 'next/link'
import Highlight from 'react-highlight.js'
import { useDispatch, useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import ConfirmDialog from '../components/confirmDialog'
import Loading from '../components/loading'
import PageWrapper from '../components/pageWrapper'
import { createErrorNotification, setSnackbarNotification, withErrorHandler } from '../shared/actions'
import { DOWNLOADING_DATA_ERROR } from '../shared/constants'
import { currentUserIdSel, firebaseLoadedSel } from '../shared/selectors'

import { removeFilters } from './actions'
import { filterFileContent, listFiltersForUser } from './filterCommons'

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

const FilterFiles = () => {
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
      const data = await withErrorHandler(DOWNLOADING_DATA_ERROR, dispatch, () => listFiltersForUser(userId!))

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
        text="Loading filter files..."
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
          {!listItems.length && (
            <Paper
              css={css`
                min-height: 200px;
                display: flex;
              `}
            >
              <span
                css={css`
                  margin: auto;
                `}
              >
                You have no filters created
              </span>
            </Paper>
          )}
          {listItems.map(({ filename, checked }, index) => {
            return (
              <ListItemButton
                key={filename}
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

import { useState } from 'react'

import { css } from '@emotion/react'
import CancelIcon from '@mui/icons-material/Cancel'
import CodeIcon from '@mui/icons-material/Code'
import InfoIcon from '@mui/icons-material/InfoOutlined'
import {
  Autocomplete,
  Theme,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import { setCurrentFilter } from '../filters/actions'
import { availableFiltersSel, currentFilterSel, filtersErrorSel } from '../filters/selectors'
import { useIsBigDevice } from '../shared/hooks'

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(1 / 2),
  },
  iconButton: {
    padding: theme.spacing(1),
  },
  divider: {
    height: '60%',
  },
  invalidQuery: {
    color: 'red',
  },
  validQuery: {
    color: theme.palette.primary.main,
  },
  command: {
    textAlign: 'center',
    whiteSpace: 'nowrap',
    marginRight: theme.spacing(1 / 2),
  },
  fullWidth: { flex: 1 },
}))

type Query = {
  command?: string
  value: string
}

interface SearchBarProps {
  className?: string
  placeholder: string
  commands: string[]
  valueOptions?: string[]
  query: Query
  isValidQuery: boolean
  onQueryChange: (newQuery: Query) => void
}

const NO_FILTER = 'no filter'

const SearchBar: React.FC<SearchBarProps> = ({
  className,
  commands,
  placeholder,
  query,
  onQueryChange,
  isValidQuery,
  valueOptions,
}) => {
  const { classes, cx } = useStyles()
  const [showDialog, setShowDialog] = useState(false)
  const isBigDevice = useIsBigDevice()
  const [showFiltersAnchor, setShowFiltersAnchor] = useState<null | HTMLElement>(null)
  const closeFiltersMenu = () => setShowFiltersAnchor(null)
  const availableFilters = useSelector(availableFiltersSel)
  const filtersError = useSelector(filtersErrorSel)
  const currentFilter = useSelector(currentFilterSel)
  const dispatch = useDispatch()

  return (
    <>
      {
        <Paper className={cx(classes.root, className)}>
          <IconButton className={classes.iconButton} onClick={() => setShowDialog(!showDialog)}>
            <InfoIcon color="primary" />
          </IconButton>
          {showDialog && (
            <Dialog onClose={() => setShowDialog(false)} open={showDialog}>
              <DialogTitle>Search information</DialogTitle>
              <DialogContent dividers>
                <Typography gutterBottom>
                  For basic searching you can use the search bar, where you can search in one of the possible{' '}
                  <b>commands</b>. Commands can be autocompleted, and the search is performed automatically.
                </Typography>
                <Typography gutterBottom>
                  For advanced querying and filtering you can use the <b>search query language</b> where you can specify
                  how, and in which fields you want to search.
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button autoFocus onClick={() => setShowDialog(false)} color="primary">
                  Close dialog
                </Button>
              </DialogActions>
            </Dialog>
          )}

          {currentFilter ? (
            <InputBase
              disabled={true}
              classes={{ root: classes.fullWidth, input: classes.fullWidth }}
              value="Search is disabled when profile is active"
              endAdornment={
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  css={css`
                    margin-right: 8px;
                  `}
                  onClick={() => dispatch(setCurrentFilter(undefined))}
                  endIcon={
                    <CancelIcon
                      color="inherit"
                      onClick={() => onQueryChange({ value: '' })}
                      css={css`
                        margin-right: 2px;
                      `}
                    />
                  }
                >
                  Click to cancel current profile
                </Button>
              }
            />
          ) : (
            <Autocomplete<string, false, false, true>
              size="medium"
              css={css`
                flex: 1;
              `}
              options={
                query.command === undefined
                  ? commands.filter((c) => c.startsWith(query.value))
                  : valueOptions !== undefined
                  ? valueOptions.filter((v) => v.startsWith(query.value))
                  : []
              }
              freeSolo={true}
              renderInput={(params) => {
                return (
                  <InputBase
                    ref={params.InputProps.ref}
                    inputProps={params.inputProps}
                    placeholder={query.command ? '' : placeholder}
                    fullWidth
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && query.value === '') {
                        onQueryChange({ ...query, command: undefined })
                      }
                    }}
                    startAdornment={
                      query.command && (
                        <Typography
                          variant="body1"
                          component="span"
                          display="block"
                          className={cx(classes.command, isValidQuery ? classes.validQuery : classes.invalidQuery)}
                        >
                          {query.command}
                        </Typography>
                      )
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <CancelIcon
                          color="primary"
                          onClick={() => onQueryChange({ value: '' })}
                          css={css`
                            margin-right: 2px;
                            cursor: pointer;
                            visibility: ${query.command || query.value ? 'visible' : 'hidden'};
                          `}
                        />
                      </InputAdornment>
                    }
                  />
                )
              }}
              onInputChange={(event, newInputVal, reason) => {
                // NOTE: for some reason this callback fires with null event and resets input value
                if (event == null) return

                if (reason === 'reset') {
                  if (valueOptions) onQueryChange({ ...query, value: newInputVal })
                  else onQueryChange({ command: newInputVal, value: '' })
                } else {
                  if (query.command === undefined && commands.includes(newInputVal)) {
                    onQueryChange({ command: newInputVal, value: '' })
                  } else if (query.command !== undefined && valueOptions && valueOptions.includes(newInputVal)) {
                    onQueryChange({ ...query, value: newInputVal })
                  } else onQueryChange({ ...query, value: newInputVal })
                }
              }}
              // NOTE: we need both values because we are switching freeSolo prop value
              value={query.value}
              disabled={!!currentFilter}
              inputValue={query.value}
            />
          )}

          {isBigDevice && (
            <>
              <Divider className={classes.divider} orientation="vertical" />
              <Tooltip title="Set filter">
                <IconButton
                  color={filtersError ? 'secondary' : 'primary'}
                  className={classes.iconButton}
                  onClick={(e) => setShowFiltersAnchor(e.currentTarget)}
                >
                  <CodeIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
          {showFiltersAnchor && (
            <Menu anchorEl={showFiltersAnchor} open={!!showFiltersAnchor} onClose={closeFiltersMenu}>
              {!availableFilters && (
                <MenuItem>
                  <CircularProgress size={24} color="primary" />
                </MenuItem>
              )}
              {availableFilters &&
                availableFilters.map((filter) => (
                  <MenuItem
                    key={filter.name}
                    onClick={() => {
                      dispatch(setCurrentFilter(filter))
                      closeFiltersMenu()
                    }}
                  >
                    {filter.name}
                  </MenuItem>
                ))}
              {availableFilters && (
                <MenuItem
                  key={NO_FILTER}
                  onClick={() => {
                    dispatch(setCurrentFilter(undefined))
                    closeFiltersMenu()
                  }}
                >
                  No filter
                </MenuItem>
              )}
              {availableFilters && !availableFilters.length && (
                <MenuItem onClick={closeFiltersMenu}>You have no filters</MenuItem>
              )}
            </Menu>
          )}
        </Paper>
      }
    </>
  )
}

export default SearchBar

import { css } from '@emotion/react'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import DeleteIcon from '@mui/icons-material/Delete'
import DoneIcon from '@mui/icons-material/Done'
import { AppBar as MuiAppBar, IconButton, Toolbar, Typography } from '@mui/material'
import Link from 'next/link'

interface AppBarProps {
  returnUrl?: string
  onSave?: (e: React.SyntheticEvent) => void
  onRemove?: (e: React.SyntheticEvent) => void
  appBarTitle: string
}

const AppBar: React.FC<AppBarProps> = ({ returnUrl, onSave, onRemove, appBarTitle }) => {
  return (
    <MuiAppBar position="static">
      <Toolbar>
        {returnUrl && (
          <Link href={returnUrl}>
            <IconButton edge="start" color="white" aria-label="back">
              <ArrowBackIcon />
            </IconButton>
          </Link>
        )}
        <Typography
          variant="h6"
          css={css`
            flex-grow: 1;
          `}
        >
          {appBarTitle}
        </Typography>
        {onSave && (
          <IconButton color="inherit" onClick={onSave}>
            <DoneIcon />
          </IconButton>
        )}
        {onRemove && (
          <IconButton color="inherit" onClick={onRemove}>
            <DeleteIcon />
          </IconButton>
        )}
      </Toolbar>
    </MuiAppBar>
  )
}

export default AppBar

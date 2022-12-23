import { css } from '@emotion/react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'

interface Props {
  open: boolean
  onCancel?: (e: React.SyntheticEvent) => void
  onConfirm?: (e: React.SyntheticEvent) => void
  ContentComponent?: React.ReactNode
  title?: string
}

const ConfirmDialog = ({ open, onCancel, onConfirm, ContentComponent, title }: Props) => {
  return (
    <Dialog onClose={onCancel} disableEnforceFocus open={open}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <DialogContent
        css={css`
          text-align: center;
        `}
      >
        {/* ContentComponent is sometimes evaluated even after the dialog is closed. */}
        {open && ContentComponent}
      </DialogContent>
      <DialogActions>
        {onCancel && (
          <Button
            onClick={onCancel}
            color="primary"
            onKeyDown={(e) => {
              if (e.key === 'Esc') onCancel(e)
            }}
          >
            Cancel
          </Button>
        )}
        {onConfirm && (
          <Button
            onClick={onConfirm}
            color="secondary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onConfirm(e)
            }}
          >
            OK
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog

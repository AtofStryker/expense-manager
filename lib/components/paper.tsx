import { css } from '@emotion/react'
import { Paper as MuiPaper, PaperProps as MuiPaperProps, Typography, Theme } from '@mui/material'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme: Theme) => ({
  paper: {
    padding: theme.spacing(2),
  },
  listContainer: {
    flex: 1,
  },
}))

interface PaperProps extends MuiPaperProps {
  label?: string
  listContainer?: boolean
}

const Paper: React.FC<PaperProps> = ({ children, label, className, listContainer, ...other }) => {
  const { classes, cx } = useStyles()

  return (
    <MuiPaper {...other} className={cx(listContainer ? classes.listContainer : classes.paper, className)}>
      {label && (
        <Typography
          color="textSecondary"
          gutterBottom
          variant="subtitle1"
          css={css`
            margin-top: -6px;
          `}
        >
          {label}
        </Typography>
      )}
      {children}
    </MuiPaper>
  )
}

export default Paper

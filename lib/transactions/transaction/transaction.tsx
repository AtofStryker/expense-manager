import { FC, memo } from 'react'

import { css } from '@emotion/react'
import AttachFileIcon from '@mui/icons-material/AttachFile'
import NoteIcon from '@mui/icons-material/Comment'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import RepeatOneIcon from '@mui/icons-material/RepeatOne'
import { Chip, Divider, IconButton, ListItem, Theme, Tooltip, Typography, ListItemButton } from '@mui/material'
import format from 'date-fns/format'
import formatDistance from 'date-fns/formatDistance'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'
import { ListChildComponentProps } from 'react-window'
import { makeStyles } from 'tss-react/mui'

import { Transaction as TransactionState } from '../../addTransaction/state'
import { DEFAULT_DATE_TIME_FORMAT } from '../../shared/constants'
import { useIsBigDevice } from '../../shared/hooks'
import { formatMoney } from '../../shared/utils'
import { State } from '../../state'
import { setConfirmTxDeleteDialogOpen } from '../actions'
import { cursorSel } from '../selectors'

const useStyles = makeStyles()((theme: Theme) => ({
  listItem: {
    flexDirection: 'column',
    alignItems: 'start',
  },
  chipField: {
    overflow: 'auto',
    display: 'flex',
    width: '100%',
    margin: 'auto',
  },
  divider: {
    width: '100%',
    marginTop: theme.spacing(1),
    marginBottom: '-' + theme.spacing(1),
  },
  listItemFirstRow: {
    display: 'flex',
    flex: 1,
    width: '100%',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    justifyContent: 'space-between',
    color: theme.palette.text.primary,
  },
  listItemSecondRow: { display: 'flex', width: '100%', flexDirection: 'row' },
  iconPanel: {
    alignSelf: 'center',
    display: 'flex',
  },
  icon: {
    margin: '4px 6px',
  },
  iconButton: {
    padding: theme.spacing(1 / 2),
  },
  cursor: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  amountWrapper: { margin: theme.spacing('auto', 4, 'auto', 0) },
  dateTimeWrapper: { margin: 'auto' },
}))

type TransactionContentProps = { tx: TransactionState; bigDevice: boolean }

const _TransactionContent = ({ tx, bigDevice }: TransactionContentProps) => {
  const tags = useSelector((state: State) => state.tags)
  const dispatch = useDispatch()
  const { classes } = useStyles()

  const Amount = (
    <div className={classes.amountWrapper}>
      <Typography
        variant="h4"
        css={css`
          color: ${tx.type === 'expense' ? 'red' : tx.type === 'income' ? 'green' : 'burlywood'};
          text-align: 'left';
        `}
      >
        {`${tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : '±'}${formatMoney(tx.amount, tx.currency)}`}
      </Typography>
    </div>
  )
  const DateComponent = (
    <Tooltip title={format(tx.dateTime, DEFAULT_DATE_TIME_FORMAT)}>
      <Typography
        variant="body1"
        css={css`
          align-self: flex-end;
          margin: auto 8px;
        `}
      >
        {`${formatDistance(tx.dateTime, new Date(), {
          includeSeconds: false,
        })} ago`}
      </Typography>
    </Tooltip>
  )

  const Tags = (
    <div className={classes.chipField}>
      {tx.tagIds.map((id) => {
        return (
          <Chip
            key={id}
            label={tags[id].name}
            onDelete={null as any}
            css={css`
              margin: 2px;
            `}
          />
        )
      })}
    </div>
  )

  const Icons = (
    <div className={classes.iconPanel}>
      {tx.repeating !== 'none' && (
        <Tooltip title={`Repeating - ${tx.repeating}`}>
          <RepeatOneIcon className={classes.icon} color={tx.repeating === 'inactive' ? 'disabled' : 'primary'} />
        </Tooltip>
      )}
      {tx.note !== '' && (
        <Tooltip title={tx.note}>
          <NoteIcon className={classes.icon} color="primary" />
        </Tooltip>
      )}
      {(tx.attachedFiles?.length ?? 0) > 0 && (
        <Tooltip title="Attached files">
          <AttachFileIcon className={classes.icon} color="primary" />
        </Tooltip>
      )}
      {bigDevice && (
        <>
          <Divider
            orientation="vertical"
            flexItem
            css={css`
              width: 2px;
            `}
          />
          <Link href={`/transactions/details?id=${tx.id}`}>
            <Tooltip title="(E)dit transaction">
              <IconButton className={classes.iconButton} data-cy="edit-icon">
                <EditIcon color="primary" />
              </IconButton>
            </Tooltip>
          </Link>

          <Tooltip title="(D)elete transaction">
            <IconButton
              className={classes.iconButton}
              onClick={(e) => {
                e.stopPropagation()

                dispatch(setConfirmTxDeleteDialogOpen(tx.id))
              }}
            >
              <DeleteIcon color="secondary" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </div>
  )

  if (bigDevice) {
    return (
      <>
        <div className={classes.listItemFirstRow}>
          {Amount}
          {Tags}
          {DateComponent}
          {Icons}
        </div>
        <Divider className={classes.divider} />
      </>
    )
  } else {
    return (
      <>
        <div className={classes.listItemFirstRow}>
          {Amount}
          {DateComponent}
        </div>
        <div className={classes.listItemSecondRow}>
          {Tags}
          {Icons}
        </div>
        <Divider className={classes.divider} />
      </>
    )
  }
}

export const TransactionContent = memo(_TransactionContent)

const Transaction: FC<ListChildComponentProps> = ({
  index,
  style,
  data /* passed as itemData from react-window list (https://react-window.now.sh/#/api/FixedSizeList) */,
}) => {
  const { classes, cx } = useStyles()
  const tx: TransactionState = data[index]
  const bigDevice = useIsBigDevice()
  const cursor = useSelector(cursorSel)
  const router = useRouter()

  if (bigDevice) {
    return (
      <ListItem
        /* React window uses inline styles to pass the styling to child components */
        /* eslint-disable-next-line react/forbid-component-props */
        style={style}
        className={cx(classes.listItem, index === cursor && classes.cursor)}
        onClick={() => router.replace(`/transactions`, `/transactions#${tx.id}`)}
        data-cy="transaction"
      >
        <TransactionContent tx={tx} bigDevice={bigDevice} />
      </ListItem>
    )
  } else {
    return (
      <Link href={`/transactions/details?id=${tx.id}`}>
        <ListItemButton
          /* React window uses inline styles to pass the styling to child components */
          /* eslint-disable-next-line react/forbid-component-props */
          style={style}
          className={classes.listItem}
          data-cy="transaction"
        >
          <TransactionContent tx={tx} bigDevice={bigDevice} />
        </ListItemButton>
      </Link>
    )
  }
}

export default memo(Transaction)

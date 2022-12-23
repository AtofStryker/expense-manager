import { memo } from 'react'

import { css } from '@emotion/react'
import AutoIcon from '@mui/icons-material/BrightnessAuto'
import EuroIcon from '@mui/icons-material/Euro'
import NotRecentlyUsedIcon from '@mui/icons-material/EventBusy'
import TotalTxsIcon from '@mui/icons-material/PostAddTwoTone'
import RepeatOneIcon from '@mui/icons-material/RepeatOne'
import TimelineIcon from '@mui/icons-material/Timeline'
import { Badge, Divider, ListItemButton, ListItemText, Tooltip, Typography, Link } from '@mui/material'
import { useSelector } from 'react-redux'
import { ListChildComponentProps } from 'react-window'
import { makeStyles } from 'tss-react/mui'

import {
  isRecentlyUsedSel,
  isRecurringTagSel,
  tagFromSortedTagsByIndex,
  totalExpenseInTransactionsSel,
  totalTransactionsSel,
} from './selectors'

const useStyles = makeStyles()({
  listItem: {
    flexDirection: 'column',
    alignItems: 'start',
  },
  divider: {
    width: '100%',
  },
  listItemFirstRow: {
    display: 'flex',
    flex: 1,
    width: '100%',
  },
  iconPanel: {
    display: 'flex',
    alignSelf: 'center',
  },
  icon: {
    margin: 3,
  },
  txsSum: {
    margin: 3,
    marginRight: 8,
  },
})

const TagItem: React.FC<ListChildComponentProps> = ({ index, style }) => {
  const tag = useSelector(tagFromSortedTagsByIndex(index))
  const totalTxs = useSelector(totalTransactionsSel(tag.id))
  const totalExpenseInTxs = useSelector(totalExpenseInTransactionsSel(tag.id))
  const isRecentlyUsed = useSelector(isRecentlyUsedSel(tag.id))
  const isRecurring = useSelector(isRecurringTagSel(tag.id))
  const { classes } = useStyles()

  return (
    <Link href={`/tags/details?id=${tag.id}`}>
      {/* React window uses inline styles to pass the styling to child components */}
      {/* eslint-disable-next-line react/forbid-component-props */}
      <ListItemButton style={style} className={classes.listItem}>
        <div
          css={css`
            display: flex;
            width: 100%;
          `}
        >
          <ListItemText
            primary={
              <Typography
                variant="subtitle1"
                css={css`
                  line-height: 44px;
                  color: black;
                `}
              >
                {tag.name}
              </Typography>
            }
          />
          <div className={classes.iconPanel}>
            {tag.automatic && (
              <Tooltip title="Automatic tag">
                <AutoIcon className={classes.icon} />
              </Tooltip>
            )}
            {tag.isAsset && (
              <Tooltip title="Represents asset">
                <TimelineIcon className={classes.icon} />
              </Tooltip>
            )}
            {isRecurring && (
              <Tooltip title="In recurring transaction">
                <RepeatOneIcon className={classes.icon} />
              </Tooltip>
            )}
            {!isRecentlyUsed && (
              <Tooltip title="Not recently used">
                <NotRecentlyUsedIcon className={classes.icon} color="secondary" />
              </Tooltip>
            )}
            <Tooltip title="Transaction count">
              <Badge className={classes.icon} badgeContent={totalTxs} max={99} color="primary">
                <TotalTxsIcon />
              </Badge>
            </Tooltip>
            <Tooltip title="Money involved">
              <Badge className={classes.txsSum} badgeContent={totalExpenseInTxs} color="primary" max={999}>
                <EuroIcon />
              </Badge>
            </Tooltip>
          </div>
        </div>
        <Divider className={classes.divider} />
      </ListItemButton>
    </Link>
  )
}

export default memo(TagItem)

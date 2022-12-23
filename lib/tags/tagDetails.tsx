import { useState } from 'react'

import { css } from '@emotion/react'
import AutoIcon from '@mui/icons-material/BrightnessAuto'
import EuroIcon from '@mui/icons-material/Euro'
import RecentlyUsedIcon from '@mui/icons-material/EventAvailable'
import NotRecentlyUsedIcon from '@mui/icons-material/EventBusy'
import TotalTxsIcon from '@mui/icons-material/PostAddTwoTone'
import RepeatOneIcon from '@mui/icons-material/RepeatOne'
import TimelineIcon from '@mui/icons-material/Timeline'
import { Typography, TextField, SvgIconProps, Theme, Checkbox, FormControlLabel } from '@mui/material'
import { map } from '@siegrift/tsfunct'
import format from 'date-fns/format'
import Router from 'next/router'
import { useSelector } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import { Tag, Transaction } from '../addTransaction/state'
import AmountField from '../components/amountField'
import AppBar from '../components/appBar'
import ConfirmDialog from '../components/confirmDialog'
import Paper from '../components/paper'
import { CURRENCIES } from '../shared/currencies'
import { defaultCurrencySel } from '../shared/selectors'
import { formatBoolean, isAmountInValidFormat } from '../shared/utils'

const useStyles = makeStyles()((theme: Theme) => ({
  root: {
    margin: theme.spacing(2),
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  paper: {
    '&:not(:last-child)': {
      marginBottom: theme.spacing(2),
    },
    '& > *:not(:first-of-type)': {
      marginTop: theme.spacing(2),
    },
  },
  amount: { width: '100%' },
  label: { width: '100%' },
}))

interface TagDetailsProps {
  appBarTitle: string
  tag: Tag
  onSave: (tag: Tag) => void
  onRemove?: () => void
  stats?: {
    totalTxs: number
    moneyInvolvedInTxs: number
    latestTransaction: Transaction | null
    isRecentlyUsed: boolean
    isRecurring: boolean
  }
}

const isValidDefaultAmount = (amount: string) => {
  return !amount || isAmountInValidFormat(amount)
}

interface UsageStatRowProps {
  label: string
  value: string | number | boolean
  Icon: React.ComponentType<SvgIconProps>
  iconColor?: SvgIconProps['color']
}

const UsageStatRow: React.FC<UsageStatRowProps> = ({ label, value, Icon, iconColor }) => {
  return (
    <div
      css={css`
        display: flex;
        margin-bottom: 2px;
      `}
    >
      <Icon
        css={css`
          margin-right: 5px;
          width: 0.8em;
        `}
        color={iconColor || 'primary'}
      />
      <Typography
        variant="body2"
        component="span"
        css={css`
          align-self: center;
          flex: 1;
        `}
      >
        {label}
      </Typography>
      <Typography
        variant="button"
        css={css`
          align-self: right;
        `}
      >
        {typeof value === 'boolean' ? formatBoolean(value) : value}
      </Typography>
    </div>
  )
}

const TagDetails = ({ tag, stats, appBarTitle, onSave, onRemove }: TagDetailsProps) => {
  const { classes } = useStyles()

  const [tagName, setTagName] = useState(tag.name)
  const [isAutotag, setIsAutotag] = useState(tag.automatic)
  const [isAsset, setIsAsset] = useState(tag.isAsset ? tag.isAsset : false)
  const [amount, setAmount] = useState(tag.defaultAmount ? tag.defaultAmount : '')
  const defaultCurrency = useSelector(defaultCurrencySel)
  const [shouldValidate, setShouldValidate] = useState({
    tagName: false,
    amount: false,
  })
  const [showRemoveTagDialog, setShowRemoveTagDialog] = useState(false)

  const onSaveHandler = () => {
    if (isValidDefaultAmount(amount) && tagName) {
      onSave({
        ...tag,
        name: tagName,
        automatic: isAutotag,
        defaultAmount: amount,
        isAsset: isAsset,
      })

      Router.push('/tags')
    } else {
      setShouldValidate(
        map(shouldValidate, (_, key) => ({
          key,
          value: true,
        })) as typeof shouldValidate
      )
    }
  }

  if (!defaultCurrency) return null
  return (
    <>
      <AppBar
        appBarTitle={appBarTitle}
        returnUrl="/tags"
        onSave={onSaveHandler}
        onRemove={onRemove ? () => setShowRemoveTagDialog(true) : undefined}
      />

      <div className={classes.root}>
        <Paper className={classes.paper}>
          <TextField fullWidth disabled label="Id" value={tag.id} />

          <TextField
            fullWidth
            label="Tag name"
            value={tagName}
            onChange={(e) => {
              setShouldValidate((obj) => ({ ...obj, tagName: true }))
              setTagName(e.target.value)
            }}
            error={shouldValidate.tagName && tagName === ''}
          />

          <AmountField
            isValidAmount={isValidDefaultAmount}
            shouldValidateAmount={shouldValidate.amount}
            value={amount}
            onChange={(newAmount) => {
              setAmount(newAmount)
              setShouldValidate((obj) => ({ ...obj, amount: true }))
            }}
            label="Default transaction amount"
            className={classes.amount}
            onPressEnter={onSaveHandler}
            currency={CURRENCIES[defaultCurrency]}
          />

          <FormControlLabel
            classes={{ label: classes.label }}
            css={css`
              flex: 1;
              width: 100%;
            `}
            control={<Checkbox checked={isAutotag} onChange={() => setIsAutotag(!isAutotag)} />}
            label={
              <div
                css={css`
                  display: flex;
                `}
              >
                <Typography
                  variant="body2"
                  component="span"
                  css={css`
                    align-self: center;
                  `}
                >
                  Automatic tag
                </Typography>
                <AutoIcon
                  css={css`
                    margin-left: 4px;
                  `}
                  color="primary"
                />
              </div>
            }
          />
          <FormControlLabel
            classes={{ label: classes.label }}
            css={css`
              flex: 1;
              width: 100%;
            `}
            control={<Checkbox checked={isAsset} onChange={() => setIsAsset(!isAsset)} />}
            label={
              <div
                css={css`
                  display: flex;
                `}
              >
                <Typography
                  variant="body2"
                  component="span"
                  css={css`
                    align-self: center;
                  `}
                >
                  Asset tag
                </Typography>
                <TimelineIcon
                  css={css`
                    margin-left: 4px;
                  `}
                  color="primary"
                />
              </div>
            }
          />
        </Paper>
        {stats && (
          <Paper
            css={css`
              flex-direction: column;
            `}
            label="Usage stats"
          >
            <UsageStatRow label="Transaction occurrences" value={stats.totalTxs} Icon={TotalTxsIcon} />
            <UsageStatRow label="Money involved" value={stats.moneyInvolvedInTxs} Icon={EuroIcon} />
            <UsageStatRow label="In recurring transaction" value={stats.isRecurring} Icon={RepeatOneIcon} />
            <UsageStatRow
              label="Last used in transaction"
              value={stats.latestTransaction ? format(stats.latestTransaction.dateTime, 'dd/MM/yyyy') : 'never'}
              Icon={stats.isRecentlyUsed ? RecentlyUsedIcon : NotRecentlyUsedIcon}
              iconColor={stats.isRecentlyUsed ? 'primary' : 'secondary'}
            />
          </Paper>
        )}
      </div>

      {showRemoveTagDialog && (
        <ConfirmDialog
          onConfirm={(e) => {
            e.stopPropagation()

            if (onRemove) {
              onRemove()
              Router.push('/tags')
            }
          }}
          onCancel={() => setShowRemoveTagDialog(false)}
          title="Do you really want to remove this tag?"
          open={true}
          ContentComponent="You won't be able to undo this action"
        />
      )}
    </>
  )
}

export default TagDetails

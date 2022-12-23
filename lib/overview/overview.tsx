import { useState } from 'react'

import { css } from '@emotion/react'
import LaunchIcon from '@mui/icons-material/Launch'
import {
  Button,
  Divider,
  FormControl,
  InputLabel,
  Link as MuiLink,
  MenuItem,
  Select,
  Theme,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import { useSelector, useDispatch } from 'react-redux'
import { makeStyles } from 'tss-react/mui'

import ChartWrapper from '../charts/chartWrapper'
import RecentBalance from '../charts/recentBalance'
import PageWrapper from '../components/pageWrapper'
import Paper from '../components/paper'
import { setCurrentFilter } from '../filters/actions'
import { availableFiltersSel, currentFilterSel } from '../filters/selectors'
import { OverviewPeriod } from '../state'
import TransactionList from '../transactions/transactionList'

import { setOverviewPeriod, setCustomDateRange as setCustomDateRangeAction, setMonth } from './actions'
import {
  overviewPeriodSel,
  overviewTransactionsSel,
  dateRangeSel,
  txsInfoSel,
  overviewMonthsSel,
  monthSel,
} from './selectors'

import 'react-datepicker/dist/react-datepicker.css'

type OverviewLabels = { [k in OverviewPeriod]: string }
const overviewLabels: OverviewLabels = {
  '7days': 'Last 7 days',
  '30days': 'Last 30 days',
  month: 'Month',
  custom: 'Custom',
}

const useStyles = makeStyles()((theme: Theme) => ({
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  marginBottom: { marginBottom: theme.spacing(1) },
  relativeBalancePos: { fontWeight: 'bold', color: 'green' },
  relativeBalanceNeg: { fontWeight: 'bold', color: 'red' },
  chartWrapper: {
    ['@media (max-height:500px)']: {
      height: '200px !important',
    },
    height: '250px !important',
  },
  link: {
    fontStyle: 'italic',
    display: 'inline-block',
    cursor: 'pointer',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
  },
  periodSelectWrapper: {
    display: 'flex',
    flex: 1,
    justifyContent: 'space-between',
    '& > *': {
      margin: theme.spacing(1),
    },
    flexWrap: 'wrap',
  },
}))

const NO_FILTER = 'no filter'

const Overview = () => {
  const { classes, cx } = useStyles()

  const txs = useSelector(overviewTransactionsSel)
  const period = useSelector(overviewPeriodSel)
  const txsInfo = useSelector(txsInfoSel)
  const dispatch = useDispatch()
  const dateRange = useSelector(dateRangeSel)
  const overviewMonths = useSelector(overviewMonthsSel)
  const month = useSelector(monthSel)
  const currentFilter = useSelector(currentFilterSel)
  const availableFilters = useSelector(availableFiltersSel)

  const [customDateRange, setCustomDateRange] = useState<[Date | null, Date | null]>([null, null])

  return (
    <PageWrapper>
      <Paper
        css={css`
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        `}
      >
        <FormControl
          css={css`
            flex: 1;
            min-width: 200px;
          `}
        >
          <InputLabel>Active filter</InputLabel>
          <Select
            value={currentFilter?.name ?? NO_FILTER}
            onChange={(e) => {
              const filterName = e.target.value
              dispatch(
                setCurrentFilter(
                  filterName === NO_FILTER ? undefined : availableFilters!.find((f) => f.name === filterName)!
                )
              )
            }}
          >
            {availableFilters?.map((filter) => (
              <MenuItem key={filter.name} value={filter.name}>
                {filter.name}
              </MenuItem>
            ))}
            <MenuItem key={NO_FILTER} value={NO_FILTER}>
              No active filter
            </MenuItem>
          </Select>
        </FormControl>

        <div
          css={css`
            display: flex;
            margin-top: 16px;
            flex-wrap: wrap;
          `}
        >
          <FormControl
            css={css`
              flex: 1;
              min-width: 200px;
              margin-right: 8px;
            `}
          >
            <InputLabel>Overview period</InputLabel>
            <Select
              value={period}
              renderValue={(val) => overviewLabels[val as OverviewPeriod]}
              onChange={(e) => dispatch(setOverviewPeriod(e.target.value as OverviewPeriod))}
            >
              {Object.keys(overviewLabels).map((label) => (
                <MenuItem key={label} value={label}>
                  {overviewLabels[label]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {period === 'month' && (
            <FormControl
              css={css`
                flex: 1;
              `}
            >
              <InputLabel>Month</InputLabel>
              <Select
                label="Month"
                value={overviewMonths[month]}
                onChange={(e) => dispatch(setMonth(overviewMonths.findIndex((m) => m === e.target.value)))}
                css={css`
                  flex: 1;
                `}
              >
                {overviewMonths.map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {period === 'custom' && (
            <>
              <DatePicker
                selected={customDateRange[0]}
                onChange={(range) => {
                  setCustomDateRange(range)
                }}
                startDate={customDateRange[0]}
                endDate={customDateRange[1]}
                selectsRange
                inline
              />
              <Button
                onClick={() => dispatch(setCustomDateRangeAction(customDateRange))}
                color="primary"
                fullWidth
                variant="contained"
                css={css`
                  flex: 1;
                  margin: 24px 8px;
                `}
              >
                Show
              </Button>
            </>
          )}
        </div>
      </Paper>

      <Paper>
        <div
          css={css`
            display: flex;
            justify-content: space-around;
            margin-top: 24px;
            margin-bottom: -15px;
          `}
        >
          <Typography
            variant="overline"
            css={css`
              text-align: center;
            `}
          >
            Relative balance
          </Typography>
        </div>

        <ChartWrapper
          className={classes.chartWrapper}
          as="div"
          renderChart={({ width, height }) => <RecentBalance width={width} height={height} dateRange={dateRange} />}
        />
        <Link href={`/charts`}>
          <MuiLink className={cx(classes.marginBottom, classes.link)} variant="body2" underline="always">
            <>
              See all charts{' '}
              <LaunchIcon
                css={css`
                  margin-bottom: -2px;
                `}
                fontSize="inherit"
              />
            </>
          </MuiLink>
        </Link>

        <div
          css={css`
            display: flex;
            justify-content: space-around;
            margin-top: 24px;
          `}
        >
          <Typography
            variant="overline"
            css={css`
              text-align: center;
            `}
          >
            Statistics
          </Typography>
        </div>
        <div className={classes.infoRow}>
          <Typography>Income</Typography>
          <Typography>{txsInfo?.income}</Typography>
        </div>
        <div className={classes.infoRow}>
          <Typography>Expense</Typography>
          <Typography>{txsInfo?.expense}</Typography>
        </div>
        <div className={classes.infoRow}>
          <Typography>Number of transactions</Typography>
          <Typography>{txsInfo?.totalTransactions}</Typography>
        </div>

        <Divider />

        <div className={classes.infoRow}>
          <Typography>Relative balance</Typography>
          <Typography
            className={
              txsInfo?.relativeBalance.startsWith('-') ? classes.relativeBalanceNeg : classes.relativeBalancePos
            }
          >
            {txsInfo?.relativeBalance}
          </Typography>
        </div>
        <div className={classes.infoRow}>
          <Typography>Avarage per day</Typography>
          <Typography
            className={txsInfo?.averagePerDay.startsWith('-') ? classes.relativeBalanceNeg : classes.relativeBalancePos}
          >
            {txsInfo?.averagePerDay}
          </Typography>
        </div>

        <div
          css={css`
            display: flex;
            justify-content: space-around;
            margin-top: 24px;
          `}
        >
          <Typography
            variant="overline"
            css={css`
              text-align: center;
            `}
          >
            Transactions
          </Typography>
        </div>
        <div
          css={css`
            height: 250px;
          `}
        >
          {/* TODO: implement keyboard events and delete transaction handling */}
          <TransactionList transactions={txs} />
        </div>
        <Link href={`/transactions`}>
          <MuiLink className={cx(classes.marginBottom, classes.link)} variant="body2" underline="always">
            <>
              See all transactions{' '}
              <LaunchIcon
                css={css`
                  margin-bottom: -2px;
                `}
                fontSize="inherit"
              />
            </>
          </MuiLink>
        </Link>
      </Paper>
    </PageWrapper>
  )
}

export default Overview

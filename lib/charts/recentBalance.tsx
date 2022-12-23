import { useCallback } from 'react'

import { css } from '@emotion/react'
import { Line } from '@nivo/line'
import addDays from 'date-fns/addDays'
import format from 'date-fns/format'
import { useSelector } from 'react-redux'

import { CURRENCIES } from '../shared/currencies'
import { mainCurrencySel } from '../shared/selectors'
import { formatMoney } from '../shared/utils'
import { DateRange } from '../types'

import { recentBalanceDataSel, displayDataSel } from './selectors'

const AXIS_DATE_FORMAT = 'd.MM'
const SLICE_DATE_FORMAT = 'd.MM.yyyy'

interface Props {
  width: number
  height: number
  dateRange?: DateRange
}

const RecentBalance = ({ width, height, dateRange }: Props) => {
  const mainCurrency = useSelector(mainCurrencySel)

  const { daysToDisplay, xAxisMergeSize, ...computedDateRange } = useSelector(displayDataSel(width, dateRange))

  const { data } = useSelector(recentBalanceDataSel(daysToDisplay, computedDateRange))

  const showSlice = useCallback(
    ({ slice }: any) => {
      if (!mainCurrency) return null

      return (
        <div
          css={css`
            background: white;
            padding: 9px 12px;
            border: 1px solid #ccc;
          `}
        >
          {`Date: ${format(addDays(computedDateRange.start, slice.points[0].data.index), SLICE_DATE_FORMAT)}`}
          {slice.points.map((point: any) => (
            <div
              key={point.id}
              css={css`
                color: ${point.serieColor};
                padding: 3px 0;
              `}
            >
              <strong>
                {point.serieId === 'income' ? '+' : '-'}
                {formatMoney(point.data.y, mainCurrency)}
              </strong>
            </div>
          ))}
        </div>
      )
    },
    [computedDateRange.start, mainCurrency]
  )
  if (data.length > 500) return null
  return (
    <div
      css={css`
        position: relative; /* to make sure the toggle absolutely positioned toggle buttons are scoped */
      `}
    >
      <Line
        width={width}
        height={height}
        data={data}
        margin={{ top: 30, right: 15, bottom: 40, left: 50 }}
        xScale={{
          type: 'point',
        }}
        enableGridX={false}
        yScale={{ type: 'linear' }}
        enableGridY={true}
        colors={{ datum: 'color' }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          ticksPosition: 'before',
          tickSize: 5,
          tickPadding: 5,
          format: (v) => {
            return (v as number) % xAxisMergeSize === 0
              ? format(addDays(computedDateRange.start, v as number), AXIS_DATE_FORMAT)
              : ''
          },
        }}
        axisLeft={{
          ticksPosition: 'before',
          tickSize: 5,
          tickPadding: 5,
          format: (v) => `${v} ${mainCurrency ? CURRENCIES[mainCurrency].symbol : ''}`,
        }}
        pointSize={3}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        enableArea
        enableSlices="x"
        curve="monotoneX"
        sliceTooltip={showSlice}
        animate={false}
      />
    </div>
  )
}
export default RecentBalance

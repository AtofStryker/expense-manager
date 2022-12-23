import { useCallback } from 'react'

import { css } from '@emotion/react'
import { Line } from '@nivo/line'
import { addMonths } from 'date-fns'
import format from 'date-fns/format'
import { useSelector } from 'react-redux'

import { CURRENCIES } from '../shared/currencies'
import { mainCurrencySel } from '../shared/selectors'
import { formatMoney } from '../shared/utils'
import { DateRange } from '../types'

import { recentBalanceDataSel, displayDataSel } from './selectors'

const AXIS_DATE_FORMAT = 'MMM yy'
const SLICE_DATE_FORMAT = 'MMMM yyyy'

interface Props {
  width: number
  height: number
  dateRange?: DateRange
}

const AssetBalance = ({ width, height, dateRange }: Props) => {
  const mainCurrency = useSelector(mainCurrencySel)

  const { monthsToDisplay, xAxisMergeSize, ...computedDateRange } = useSelector(displayDataSel(width, dateRange))

  const data = useSelector(recentBalanceDataSel(monthsToDisplay, computedDateRange))

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
          {format(addMonths(computedDateRange.start, slice.points[0].data.index), SLICE_DATE_FORMAT)}
          {slice.points.map((point: any) => (
            <div
              key={point.id}
              css={css`
                color: ${point.serieColor};
                padding: 3px 0;
              `}
            >
              <strong>
                {point.serieId + ': '}
                {formatMoney(point.data.y, mainCurrency)}
              </strong>
            </div>
          ))}
        </div>
      )
    },
    [mainCurrency, computedDateRange]
  )

  // TODO: for some reason width can be 0 while calling selectors and then they cant work properly
  // so we return data = null, when width updates to correct value the component rerenders and we
  // calculate correct data
  if (data === null) return null

  if (data.length > 500) return null

  let minY = -500
  let maxY = 500
  let maxAssetName = 50
  data.forEach((asset, i) => {
    maxAssetName = i === 0 ? asset.id.length : Math.max(maxAssetName, asset.id.length)
    asset.data.forEach((point, j) => {
      minY = i === 0 && j === 0 ? point.y : Math.min(minY, point.y)
      maxY = i === 0 && j === 0 ? point.y : Math.max(maxY, point.y)
    })
  })

  const formatMoneydValue = (v: number) => {
    const absV = Math.abs(v)
    if (absV >= 1000000) return v / 1000000 + 'M'
    if (absV >= 1000) return v / 1000 + 'K'
    return v
  }

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
        margin={{ top: 30, right: 20, bottom: 50, left: 50 }}
        xScale={{
          type: 'point',
        }}
        enableGridX={false}
        yScale={{
          type: 'linear',
          min: Math.round(minY),
          max: Math.round(maxY),
        }}
        enableGridY={true}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          ticksPosition: 'before',
          tickSize: 5,
          tickPadding: 5,
          format: (v) => {
            return (v as number) % xAxisMergeSize === 0
              ? format(addMonths(computedDateRange.start, v as number), AXIS_DATE_FORMAT)
              : ''
          },
        }}
        axisLeft={{
          ticksPosition: 'before',
          tickSize: 5,
          tickPadding: 5,
          format: (v) => `${formatMoneydValue(v)} ${mainCurrency ? CURRENCIES[mainCurrency].symbol : ''}`,
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
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 50,
            itemWidth: maxAssetName * 6.5,
            itemHeight: 20,
            itemsSpacing: 5,
            symbolSize: 10,
            symbolShape: 'square',
            itemDirection: 'left-to-right',
            itemTextColor: '#777',
          },
        ]}
      />
    </div>
  )
}
export default AssetBalance

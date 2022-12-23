import { css } from '@emotion/react'
import { useSelector } from 'react-redux'

import ChartWrapper from '../charts/chartWrapper'
import PageWrapper from '../components/pageWrapper'

import AssetBalance from './assetBalance'
import AssetPercentages from './assetPercentages'
import { assetTagsSumsSel } from './selectors'

const Assets = () => {
  const data = useSelector(assetTagsSumsSel)

  return (
    <PageWrapper>
      <ChartWrapper
        label="Recent asset balance"
        renderChart={({ width, height }) => <AssetBalance width={width} height={height} />}
      />
      <ChartWrapper label="Asset percentages" renderChart={() => <AssetPercentages />} />
      <table>
        <tr
          css={css`
            text-align: left;
          `}
        >
          <th>Asset</th>
          <th>Value</th>
        </tr>
        {data.map((asset) => (
          <tr key={asset.tag.name}>
            <td>{asset.tag.name}</td>
            <td>{asset.value}</td>
          </tr>
        ))}
      </table>
    </PageWrapper>
  )
}

export default Assets

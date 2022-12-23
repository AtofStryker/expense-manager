import PageWrapper from '../components/pageWrapper'

import AllTransactions from './allTransactions'
import ChartWrapper from './chartWrapper'
import RecentBalance from './recentBalance'
import TagPercentages from './tagPercentages'

const Charts = () => {
  return (
    <PageWrapper>
      <ChartWrapper
        label="Recent balance"
        renderChart={({ width, height }) => <RecentBalance width={width} height={height} />}
      />

      <ChartWrapper
        label="All Transactions"
        renderChart={({ width, height }) => <AllTransactions width={width} height={height} />}
      />

      <ChartWrapper
        label="Tag percentages"
        renderChart={({ width, height }) => <TagPercentages width={width} height={height} />}
      />
    </PageWrapper>
  )
}

export default Charts

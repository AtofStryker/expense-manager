import { ResponsivePie } from '@nivo/pie'
import { useSelector } from 'react-redux'

import { assetTagSharesSel } from './selectors'

const AssetPercentages = () => {
  const data = useSelector(assetTagSharesSel)

  return (
    <ResponsivePie
      data={data}
      margin={{ top: 65, right: 80, bottom: 35, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      borderWidth={1}
      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#333333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
    />
  )
}

export default AssetPercentages

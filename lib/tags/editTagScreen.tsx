import { useRouter } from 'next/router'
import { useDispatch, useSelector } from 'react-redux'

import { uploadToFirebase } from '../actions'
import { Tag } from '../addTransaction/state'

import { removeTag } from './actions'
import {
  isRecentlyUsedSel,
  isRecurringTagSel,
  latestTransactionWithTagSel,
  tagByIdSel,
  totalExpenseInTransactionsSel,
  totalTransactionsSel,
} from './selectors'
import TagDetails from './tagDetails'

interface WithValidTagIdProps {
  children: (reduxTag: Tag) => JSX.Element
}

const WithValidTagId: React.FC<WithValidTagIdProps> = (props) => {
  const router = useRouter()
  const reduxTag = useSelector(tagByIdSel(router.query.id as string))

  if (reduxTag) return props.children(reduxTag)
  else return null
}

interface EditTagScreenContentProps {
  tag: Tag
}

const EditTagScreenContent: React.FC<EditTagScreenContentProps> = ({ tag }) => {
  const dispatch = useDispatch()
  const totalTxs = useSelector(totalTransactionsSel(tag.id))
  const moneyInvolvedInTxs = useSelector(totalExpenseInTransactionsSel(tag.id))
  const latestTransaction = useSelector(latestTransactionWithTagSel(tag.id))
  const isRecurring = useSelector(isRecurringTagSel(tag.id))
  const isRecentlyUsed = useSelector(isRecentlyUsedSel(tag.id))

  return (
    <TagDetails
      appBarTitle="Tag details"
      tag={tag}
      stats={{
        totalTxs,
        moneyInvolvedInTxs,
        latestTransaction,
        isRecurring,
        isRecentlyUsed,
      }}
      onSave={(modifiedTag) => dispatch(uploadToFirebase({ tags: [modifiedTag] }))}
      onRemove={() => dispatch(removeTag(tag.id))}
    />
  )
}

const EditTagScreen = () => {
  return <WithValidTagId>{(reduxTag) => <EditTagScreenContent tag={reduxTag} />}</WithValidTagId>
}

export default EditTagScreen

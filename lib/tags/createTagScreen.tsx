import { useDispatch, useSelector } from 'react-redux'
import { v4 as uuid } from 'uuid'

import { uploadToFirebase } from '../actions'
import { currentUserIdSel } from '../shared/selectors'

import TagDetails from './tagDetails'

const CreateTagScreen = () => {
  const dispatch = useDispatch()
  const userId = useSelector(currentUserIdSel)

  if (!userId) return null
  return (
    <TagDetails
      appBarTitle="Create new tag"
      tag={{
        uid: userId,
        id: uuid(),
        automatic: false,
        name: '',
      }}
      onSave={(tag) => dispatch(uploadToFirebase({ tags: [tag] }))}
    />
  )
}

export default CreateTagScreen

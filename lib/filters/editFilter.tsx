import { useRouter } from 'next/router'

import PageWrapper from '../components/pageWrapper'

import CodeEditor from './codeEditor'

const EditFilter = () => {
  const router = useRouter()
  const name = router.query.name as string

  return (
    <PageWrapper>
      <CodeEditor initialFilterName={decodeURIComponent(name)} />
    </PageWrapper>
  )
}

export default EditFilter

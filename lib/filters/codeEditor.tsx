import { useState, useRef, useEffect } from 'react'

import { css } from '@emotion/react'
import type { OnMount } from '@monaco-editor/react'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CopyIcon from '@mui/icons-material/FileCopy'
import FormatIcon from '@mui/icons-material/FormatAlignCenter'
import RunCode from '@mui/icons-material/PlayCircleOutline'
import SaveIcon from '@mui/icons-material/Save'
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  CircularProgress,
  Collapse,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import dynamic from 'next/dynamic'
import Highlight from 'react-highlight.js'
import { useDispatch, useSelector } from 'react-redux'

import Loading from '../components/loading'
import Paper from '../components/paper'
import { createSuccessNotification, setSnackbarNotification } from '../shared/actions'
import { currentUserIdSel } from '../shared/selectors'

import { uploadFilter } from './actions'
import { filterFileContent, FILTER_TEMPLATE, listFiltersForUser } from './filterCommons'
import { frozenFilterDataSel } from './selectors'

const VALID_FILTER_NAME_PATTERN = /^[A-Za-z0-9 ]+$/

const MonacoEditorLoader = () => (
  <Loading
    size={50}
    cssOverrides={{
      image: css`
        margin: 16px auto;
      `,
    }}
  />
)

const MonacoEditor = dynamic(import('@monaco-editor/react'), {
  ssr: false,
  loading: MonacoEditorLoader,
})

const editorDevLibsPromises = {
  format: import('js-beautify'),
}
const editorDevLibs = {}

interface Props {
  initialFilterName?: string
}

const CodeEditor = ({ initialFilterName }: Props) => {
  const [editorOutput, setEditorOutput] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const frozenData = useSelector(frozenFilterDataSel)
  const editorRef = useRef<Parameters<OnMount>[0]>()
  const [initialCode, setInitialCodeValue] = useState<string | null | undefined>(undefined)
  const [filterNameError, setFilterNameError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [persistedFilterName, setPersistedFilterName] = useState(initialFilterName)
  const [filterName, setFilterName] = useState(persistedFilterName ?? 'New profile')
  const [showInfo, setShowInfo] = useState(true)
  const dispatch = useDispatch()
  const userId = useSelector(currentUserIdSel)

  useEffect(() => {
    setPersistedFilterName(initialFilterName)
    setFilterName(initialFilterName ?? 'New profile')
  }, [initialFilterName])

  useEffect(() => {
    // unfortunately, use effect cannot use async/await
    const fn = async () => {
      if (!userId) return

      const entries = Object.entries(editorDevLibsPromises)
      const res = await Promise.all(entries.map((x): Promise<any> => x[1]))
      entries.forEach((e, ind) => {
        editorDevLibs[e[0]] = res[ind]
      })

      let codeValue
      if (!initialFilterName) {
        codeValue = FILTER_TEMPLATE
      } else {
        try {
          codeValue = await filterFileContent(userId, initialFilterName)
        } catch {
          codeValue = null
        }
      }
      setInitialCodeValue(codeValue)
      if (editorRef.current && codeValue !== null) editorRef.current.setValue(codeValue)

      setLoadingData(false)
    }

    fn()
  }, [initialFilterName, userId])

  const validate = async () => {
    // little side effect fn to simplify the code
    const error = (m: string) => {
      setFilterNameError(m)
      return false
    }

    if (!userId) return error('User not signed in yet')

    const validName = VALID_FILTER_NAME_PATTERN.test(filterName)
    if (!validName) return error(`Filename must follow pattern: ${VALID_FILTER_NAME_PATTERN}`)

    // check for overwrites
    if (persistedFilterName !== filterName) {
      const data = await listFiltersForUser(userId)
      if (typeof data === 'string') return error(data)
      else {
        if (data.includes(filterName)) return error(`Filter with name ${filterName} already exists!`)
      }
    }

    return true
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)

    if (await validate()) {
      dispatch(uploadFilter(filterName, editorRef.current.getValue()))
      setPersistedFilterName(filterName)
    }

    setSaving(false)
  }

  const handleRunCode = () => {
    if (loadingData) return

    try {
      const unsafeFilter = eval(editorRef.current?.getValue() ?? '')
      const rawOutput = unsafeFilter(frozenData)
      setEditorOutput(JSON.stringify(rawOutput, null, 2))
      setExpanded(true)
    } catch (e) {
      setEditorOutput(JSON.stringify(e, Object.getOwnPropertyNames(e), 2))
      setExpanded(true)
    }
  }

  const handleFormatCode = () => {
    const editor = editorRef.current
    if (!editor) return

    const val = editor.getValue()
    const formatter = (editorDevLibs as any).format.default as typeof import('js-beautify')
    editor.setValue(formatter(val))
  }

  return (
    <div
      css={css`
        margin-bottom: 16px;
        display: flex;
        flex-direction: column;
      `}
    >
      <TextField
        variant="outlined"
        size="small"
        label="Name"
        error={!!filterNameError}
        helperText={filterNameError}
        value={filterName}
        onChange={(e) => {
          setFilterName(e.target.value)
          setFilterNameError(null)
        }}
      />

      <div
        css={css`
          display: flex;
          margin-top: 8px;
        `}
      >
        <Button
          size="small"
          css={css`
            flex: 1;
          `}
          variant="contained"
          color="primary"
          onClick={handleSave}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        >
          Save (ctrl + S)
        </Button>
        <Button
          size="small"
          css={css`
            flex: 1;
            margin-left: 16px;
          `}
          variant="contained"
          color="primary"
          onClick={handleRunCode}
          disabled={loadingData}
          startIcon={loadingData ? <CircularProgress size={16} color="inherit" /> : <RunCode />}
        >
          Run (ctrl + R)
        </Button>
        <Button
          size="small"
          css={css`
            flex: 1;
            margin-left: 16px;
          `}
          variant="contained"
          color="primary"
          onClick={handleFormatCode}
          startIcon={<FormatIcon />}
        >
          Format (ctrl + shift + F)
        </Button>
      </div>

      <Collapse in={showInfo}>
        <Alert
          severity="info"
          css={css`
            margin-top: 8px;
          `}
          onClose={() => setShowInfo(false)}
        >
          Use the code editor to create a functions, which transforms the data any way you want. This code will be
          passed to <i>eval</i> and executed on readonly state data.
        </Alert>
      </Collapse>

      <Paper
        css={css`
          padding: 0;
          margin-top: 8px;
        `}
      >
        <MonacoEditor
          height={'60vh'}
          language="javascript"
          options={{
            automaticLayout: true,
            minimap: {
              enabled: false,
            },
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor
            if (typeof initialCode === 'string') editor.setValue(initialCode)

            editor.onKeyDown((e: KeyboardEvent) => {
              if (e.ctrlKey && e.code === monaco.KeyCode.KEY_S) {
                e.preventDefault()
                handleFormatCode()
                handleSave()
              }
              if (e.ctrlKey && e.code === monaco.KeyCode.KEY_R) {
                e.preventDefault()
                handleRunCode()
              } else if (e.ctrlKey && e.shiftKey && e.code === monaco.KeyCode.KEY_F) {
                e.preventDefault()
                handleFormatCode()
              }
            })
          }}
        />
      </Paper>

      <Accordion
        css={css`
          margin-top: 1px;
        `}
        expanded={expanded}
        onChange={() => setExpanded(!expanded)}
        TransitionProps={{ unmountOnExit: true }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          css={css`
            min-height: 40px;
            height: 40px;
          `}
        >
          <Typography>Code output</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div
            css={css`
              min-height: 50px;
              max-height: 50vh;
              overflow: auto;
              width: 100%;
            `}
          >
            <div>
              <Tooltip title="Copy editor output to clipboard">
                <IconButton
                  color="primary"
                  css={css`
                    position: absolute;
                    right: 35px;
                    visibility: ${expanded ? 'visible' : 'hidden'};
                  `}
                  onClick={async () => {
                    await navigator.clipboard.writeText(editorRef.current.getValue())

                    dispatch(setSnackbarNotification(createSuccessNotification('Copied to clipboard!')))
                  }}
                >
                  <CopyIcon />
                </IconButton>
              </Tooltip>
              <Highlight language="json">{editorOutput}</Highlight>
            </div>
          </div>
        </AccordionDetails>
      </Accordion>
    </div>
  )
}

export default CodeEditor
